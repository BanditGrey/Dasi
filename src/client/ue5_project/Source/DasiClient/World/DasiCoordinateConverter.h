// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "DasiCoordinateConverter.generated.h"

/**
 * Modo de mapeamento espacial entre o servidor autoritativo e o mundo 3D da UE5
 */
UENUM(BlueprintType)
enum class ELorenciaMappingMode : uint8
{
	/** Mapeamento direto de escala com origem centralizada */
	CenteredScale UMETA(DisplayName = "Centered Scale (2048m Lorencia)"),

	/** Mapeamento isométrico rotacionado a 45 graus (estilo Continent of Legend) */
	IsometricRotated UMETA(DisplayName = "Isometric Rotated (45 deg)"),

	/** Mapeamento direto 1:1 cm */
	DirectUnits UMETA(DisplayName = "Direct Unreal Units")
};

/**
 * Conversor Autoritativo de Coordenadas de Lorencia
 * Mapeia as posições 2D do servidor autoritativo (ws://localhost:8080)
 * para coordenadas espaciais 3D reais no mundo do Unreal Engine 5,
 * incluindo projeção vertical contra o terreno (Landscape / Ground Tracing).
 */
UCLASS()
class DASICLIENT_API UDasiCoordinateConverter : public UBlueprintFunctionLibrary
{
	GENERATED_BODY()

public:
	// ==========================================
	// CONFIGURAÇÕES GLOBAIS DE CALIBRAÇÃO
	// ==========================================

	/** Centro do mapa no sistema de coordenadas do servidor (ex: arena 840x420 -> centro 420x210) */
	static inline FVector2D ServerReferenceCenter = FVector2D(420.0f, 210.0f);

	/** Escala de conversão: unidades do servidor para centímetros no Unreal Engine */
	static inline float ServerToUnrealScale = 120.0f; // 1 unit do servidor = 1.2 metros no UE5

	/** Ponto de ancoragem central da Cidadela de Lorencia no mundo UE5 (Praça Central) */
	static inline FVector WorldCitadelOrigin = FVector(0.0f, 0.0f, 0.0f);

	/** Modo de projeção padrão */
	static inline ELorenciaMappingMode DefaultMappingMode = ELorenciaMappingMode::CenteredScale;

	// ==========================================
	// MÉTODOS DE CONVERSÃO
	// ==========================================

	/**
	 * Converte coordenadas 2D do servidor (ServerX, ServerY) em posição 3D no mundo UE5.
	 * Executa raycast vertical para projetar a coordenada perfeitamente sobre a superfície
	 * do Landscape ou geometria do cenário.
	 */
	UFUNCTION(BlueprintPure, Category = "Dasi|World|Coordinates", meta = (WorldContext = "WorldContextObject"))
	static FVector ServerToWorld(
		const UObject* WorldContextObject,
		float ServerX,
		float ServerY,
		float AdditionalZOffset = 0.0f,
		ELorenciaMappingMode MappingMode = ELorenciaMappingMode::CenteredScale
	);

	/**
	 * Versão FVector2D de ServerToWorld
	 */
	UFUNCTION(BlueprintPure, Category = "Dasi|World|Coordinates", meta = (WorldContext = "WorldContextObject"))
	static FVector ServerVectorToWorld(
		const UObject* WorldContextObject,
		const FVector2D& ServerCoords,
		float AdditionalZOffset = 0.0f,
		ELorenciaMappingMode MappingMode = ELorenciaMappingMode::CenteredScale
	);

	/**
	 * Converte coordenadas 3D do mundo UE5 de volta para o plano 2D do servidor
	 */
	UFUNCTION(BlueprintPure, Category = "Dasi|World|Coordinates", meta = (WorldContext = "WorldContextObject"))
	static FVector2D WorldToServer(
		const UObject* WorldContextObject,
		const FVector& WorldLocation,
		ELorenciaMappingMode MappingMode = ELorenciaMappingMode::CenteredScale
	);

	/**
	 * Realiza raycast contra o Landscape/WorldStatic para encontrar a altitude Z do solo
	 */
	UFUNCTION(BlueprintPure, Category = "Dasi|World|Coordinates", meta = (WorldContext = "WorldContextObject"))
	static float QueryGroundZ(
		const UObject* WorldContextObject,
		float WorldX,
		float WorldY,
		float FallbackZ = 0.0f,
		float RaycastStartHeight = 8000.0f,
		float RaycastDistance = 16000.0f
	);

	/**
	 * Configura os parâmetros de calibração do conversor em tempo de execução
	 */
	UFUNCTION(BlueprintCallable, Category = "Dasi|World|Coordinates")
	static void SetCalibrationParameters(
		const FVector2D& InServerCenter,
		float InScale,
		const FVector& InWorldOrigin,
		ELorenciaMappingMode InMode
	);
};
