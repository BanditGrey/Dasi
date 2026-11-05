// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#include "World/DasiCoordinateConverter.h"
#include "World/DasiLorenciaLevelScriptActor.h"
#include "Engine/World.h"
#include "CollisionQueryParams.h"
#include "Engine/Engine.h"
#include "DasiClient.h"

FVector UDasiCoordinateConverter::ServerToWorld(
	const UObject* WorldContextObject,
	float ServerX,
	float ServerY,
	float AdditionalZOffset,
	ELorenciaMappingMode MappingMode
)
{
	// 1. Prioridade: Se o Level Script Actor de Lorencia estiver ativo no nível, utiliza seu mapeamento espacial nativo
	if (WorldContextObject)
	{
		if (UWorld* World = GEngine->GetWorldFromContextObject(WorldContextObject, EGetWorldErrorMode::ReturnNull))
		{
			if (ADasiLorenciaLevelScriptActor* LevelScript = Cast<ADasiLorenciaLevelScriptActor>(World->GetLevelScriptActor()))
			{
				FVector WorldPos = LevelScript->ConvertServerToWorldCoords(
					FVector2D(ServerX, ServerY),
					EDasiCoordinateSystem::DevArena_840x420,
					true
				);
				WorldPos.Z += AdditionalZOffset;
				return WorldPos;
			}
		}
	}

	// 2. Mapeamento matemático configurável independente de nível
	float WorldX = WorldCitadelOrigin.X;
	float WorldY = WorldCitadelOrigin.Y;

	const float DeltaX = ServerX - ServerReferenceCenter.X;
	const float DeltaY = ServerY - ServerReferenceCenter.Y;

	switch (MappingMode)
	{
	case ELorenciaMappingMode::CenteredScale:
		WorldX += DeltaX * ServerToUnrealScale;
		WorldY += DeltaY * ServerToUnrealScale;
		break;

	case ELorenciaMappingMode::IsometricRotated:
		// Rotação canônica de 45 graus do Continent of Legend
		{
			constexpr float InvSqrt2 = 0.70710678118f;
			const float RotX = (DeltaX - DeltaY) * InvSqrt2;
			const float RotY = (DeltaX + DeltaY) * InvSqrt2;
			WorldX += RotX * ServerToUnrealScale;
			WorldY += RotY * ServerToUnrealScale;
		}
		break;

	case ELorenciaMappingMode::DirectUnits:
		WorldX = WorldCitadelOrigin.X + (ServerX * ServerToUnrealScale);
		WorldY = WorldCitadelOrigin.Y + (ServerY * ServerToUnrealScale);
		break;
	}

	const float GroundZ = QueryGroundZ(WorldContextObject, WorldX, WorldY, WorldCitadelOrigin.Z);
	return FVector(WorldX, WorldY, GroundZ + AdditionalZOffset);
}

FVector UDasiCoordinateConverter::ServerVectorToWorld(
	const UObject* WorldContextObject,
	const FVector2D& ServerCoords,
	float AdditionalZOffset,
	ELorenciaMappingMode MappingMode
)
{
	return ServerToWorld(WorldContextObject, ServerCoords.X, ServerCoords.Y, AdditionalZOffset, MappingMode);
}

FVector2D UDasiCoordinateConverter::WorldToServer(
	const UObject* WorldContextObject,
	const FVector& WorldLocation,
	ELorenciaMappingMode MappingMode
)
{
	// 1. Prioridade: Se o Level Script Actor estiver ativo, utiliza sua conversão inversa
	if (WorldContextObject)
	{
		if (UWorld* World = GEngine->GetWorldFromContextObject(WorldContextObject, EGetWorldErrorMode::ReturnNull))
		{
			if (ADasiLorenciaLevelScriptActor* LevelScript = Cast<ADasiLorenciaLevelScriptActor>(World->GetLevelScriptActor()))
			{
				return LevelScript->ConvertWorldToServerCoords(WorldLocation, EDasiCoordinateSystem::DevArena_840x420);
			}
		}
	}

	// 2. Mapeamento matemático inverso independente
	if (FMath::IsNearlyZero(ServerToUnrealScale))
	{
		return ServerReferenceCenter;
	}

	const float RelX = WorldLocation.X - WorldCitadelOrigin.X;
	const float RelY = WorldLocation.Y - WorldCitadelOrigin.Y;

	switch (MappingMode)
	{
	case ELorenciaMappingMode::CenteredScale:
		return FVector2D(
			ServerReferenceCenter.X + (RelX / ServerToUnrealScale),
			ServerReferenceCenter.Y + (RelY / ServerToUnrealScale)
		);

	case ELorenciaMappingMode::IsometricRotated:
		{
			constexpr float InvSqrt2 = 0.70710678118f;
			const float UnscaledRotX = RelX / ServerToUnrealScale;
			const float UnscaledRotY = RelY / ServerToUnrealScale;
			const float DeltaX = (UnscaledRotX + UnscaledRotY) * InvSqrt2;
			const float DeltaY = (UnscaledRotY - UnscaledRotX) * InvSqrt2;
			return FVector2D(
				ServerReferenceCenter.X + DeltaX,
				ServerReferenceCenter.Y + DeltaY
			);
		}

	case ELorenciaMappingMode::DirectUnits:
		return FVector2D(
			(WorldLocation.X - WorldCitadelOrigin.X) / ServerToUnrealScale,
			(WorldLocation.Y - WorldCitadelOrigin.Y) / ServerToUnrealScale
		);
	}

	return ServerReferenceCenter;
}

float UDasiCoordinateConverter::QueryGroundZ(
	const UObject* WorldContextObject,
	float WorldX,
	float WorldY,
	float FallbackZ,
	float RaycastStartHeight,
	float RaycastDistance
)
{
	if (!WorldContextObject)
	{
		return FallbackZ;
	}

	UWorld* World = GEngine->GetWorldFromContextObject(WorldContextObject, EGetWorldErrorMode::ReturnNull);
	if (!World)
	{
		return FallbackZ;
	}

	const FVector TraceStart(WorldX, WorldY, RaycastStartHeight);
	const FVector TraceEnd(WorldX, WorldY, RaycastStartHeight - RaycastDistance);

	FHitResult HitResult;
	FCollisionQueryParams QueryParams(SCENE_QUERY_STAT(DasiLandscapeGroundQuery), false);
	QueryParams.bReturnPhysicalMaterial = false;

	// Trace contra WorldStatic (Landscape, malhas de terreno, pontes, estradas)
	if (World->LineTraceSingleByChannel(HitResult, TraceStart, TraceEnd, ECC_WorldStatic, QueryParams))
	{
		return HitResult.ImpactPoint.Z;
	}

	return FallbackZ;
}

void UDasiCoordinateConverter::SetCalibrationParameters(
	const FVector2D& InServerCenter,
	float InScale,
	const FVector& InWorldOrigin,
	ELorenciaMappingMode InMode
)
{
	ServerReferenceCenter = InServerCenter;
	ServerToUnrealScale = InScale;
	WorldCitadelOrigin = InWorldOrigin;
	DefaultMappingMode = InMode;

	UE_LOG(LogDasiWorld, Log, TEXT("UDasiCoordinateConverter: Parâmetros atualizados. Centro: (%f, %f), Escala: %f, Origem: %s"),
		InServerCenter.X, InServerCenter.Y, InScale, *InWorldOrigin.ToString());
}
