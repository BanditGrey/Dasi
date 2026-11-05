#pragma once

#include "CoreMinimal.h"
#include "DasiCombatTypes.generated.h"

/**
 * Sacred Continent of Legend Damage Types with associated canonical colors
 */
UENUM(BlueprintType)
enum class EDasiDamageType : uint8
{
	Normal         UMETA(DisplayName = "Normal (White)"),
	Skill          UMETA(DisplayName = "Skill (Orange)"),
	Critical       UMETA(DisplayName = "Critical (Cyan)"),
	Excellent      UMETA(DisplayName = "Excellent (Neon Green)"),
	IgnoreDefense  UMETA(DisplayName = "Ignore Defense (Gold)"),
	Miss           UMETA(DisplayName = "Miss (Gray)")
};

/**
 * Visual & Hit-Stop configuration per damage type
 */
USTRUCT(BlueprintType)
struct FDasiDamageVisualConfig
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat")
	EDasiDamageType DamageType = EDasiDamageType::Normal;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat")
	FString ColorHex = TEXT("#FFFFFF");

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat")
	FLinearColor LinearColor = FLinearColor::White;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat")
	float HitStopDurationSeconds = 0.040f; // 40ms to 120ms

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat")
	float CustomTimeDilation = 0.05f; // Local time-dilation during freeze

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat")
	float MeshJitterAmplitudeCm = 0.8f; // Visual weapon blade micro-jitter

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat")
	float CameraShakeAmplitude = 0.15f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat")
	float CameraShakeFrequency = 18.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat")
	float NumberScaleMultiplier = 1.0f;
};

/**
 * Wing Tier enumeration
 */
UENUM(BlueprintType)
enum class EDasiWingTier : uint8
{
	None              UMETA(DisplayName = "No Wings"),
	Tier1_Neophyte    UMETA(DisplayName = "Tier 1 (Neophyte Wings)"),
	Tier2_Celestial   UMETA(DisplayName = "Tier 2 (Celestial / Archangel Wings)"),
	Tier3_Sovereign   UMETA(DisplayName = "Tier 3 (Sovereign / Emperor Wings)")
};

/**
 * Wing aerodynamic dynamic simulation output state
 */
USTRUCT(BlueprintType)
struct FDasiWingPhysicsState
{
	GENERATED_BODY()

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Wings")
	float WingspanMeters = 2.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Wings")
	float FlapFrequencyHz = 1.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Wings")
	float LiftForceNewtons = 0.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Wings")
	float BankingAngleDegrees = 0.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Wings")
	float GravityReductionFactor = 0.0f; // 0.0 = normal gravity, 1.0 = zero-g glide
};

/**
 * Agility 3-Phase Animation Timing
 */
USTRUCT(BlueprintType)
struct FDasiAttackPhaseTiming
{
	GENERATED_BODY()

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Agility")
	float WindupTime = 0.350f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Agility")
	float ActiveStrikeTime = 0.180f; // Incompressible >= 0.065s

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Agility")
	float RecoveryTime = 0.420f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Agility")
	float TotalDuration = 0.950f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Agility")
	float ComboWindowStart = 0.600f; // Normalized ratio (0..1) within recovery

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Agility")
	float AttacksPerSecond = 1.05f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Agility")
	bool bHasAfterImages = false; // Agility >= 1200 ghosting trails
};

/**
 * Volumetric Weapon Trace Hit Record
 */
USTRUCT(BlueprintType)
struct FDasiHitRecord
{
	GENERATED_BODY()

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Combat")
	TWeakObjectPtr<AActor> Attacker;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Combat")
	TWeakObjectPtr<AActor> Target;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Combat")
	FName HitSocket = NAME_None;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Combat")
	FVector HitLocation = FVector::ZeroVector;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Combat")
	FVector HitNormal = FVector::UpVector;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Combat")
	float ImpactVelocity = 0.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Combat")
	float RemainingCleaveEnergy = 100.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Combat")
	bool bDeflected = false;
};

/**
 * Helper static methods for Dasi Combat configuration
 */
class DASICLIENT_API FDasiCombatHelper
{
public:
	static FDasiDamageVisualConfig GetVisualConfig(EDasiDamageType Type)
	{
		FDasiDamageVisualConfig Cfg;
		Cfg.DamageType = Type;

		switch (Type)
		{
		case EDasiDamageType::Normal:
			Cfg.ColorHex = TEXT("#FFFFFF");
			Cfg.LinearColor = FLinearColor(1.0f, 1.0f, 1.0f, 1.0f);
			Cfg.HitStopDurationSeconds = 0.040f;
			Cfg.CustomTimeDilation = 0.05f;
			Cfg.MeshJitterAmplitudeCm = 0.8f;
			Cfg.CameraShakeAmplitude = 0.15f;
			Cfg.CameraShakeFrequency = 18.0f;
			Cfg.NumberScaleMultiplier = 1.0f;
			break;

		case EDasiDamageType::Skill:
			Cfg.ColorHex = TEXT("#FF8800");
			Cfg.LinearColor = FLinearColor(1.0f, 0.533f, 0.0f, 1.0f);
			Cfg.HitStopDurationSeconds = 0.060f;
			Cfg.CustomTimeDilation = 0.02f;
			Cfg.MeshJitterAmplitudeCm = 1.4f;
			Cfg.CameraShakeAmplitude = 0.30f;
			Cfg.CameraShakeFrequency = 22.0f;
			Cfg.NumberScaleMultiplier = 1.25f;
			break;

		case EDasiDamageType::Critical:
			Cfg.ColorHex = TEXT("#00E5FF");
			Cfg.LinearColor = FLinearColor(0.0f, 0.898f, 1.0f, 1.0f);
			Cfg.HitStopDurationSeconds = 0.085f;
			Cfg.CustomTimeDilation = 0.00f; // Absolute freeze
			Cfg.MeshJitterAmplitudeCm = 2.2f;
			Cfg.CameraShakeAmplitude = 0.55f;
			Cfg.CameraShakeFrequency = 28.0f;
			Cfg.NumberScaleMultiplier = 1.55f;
			break;

		case EDasiDamageType::Excellent:
			Cfg.ColorHex = TEXT("#39FF14");
			Cfg.LinearColor = FLinearColor(0.224f, 1.0f, 0.078f, 1.0f);
			Cfg.HitStopDurationSeconds = 0.100f;
			Cfg.CustomTimeDilation = 0.00f; // Absolute freeze
			Cfg.MeshJitterAmplitudeCm = 2.8f;
			Cfg.CameraShakeAmplitude = 0.70f;
			Cfg.CameraShakeFrequency = 30.0f;
			Cfg.NumberScaleMultiplier = 1.85f;
			break;

		case EDasiDamageType::IgnoreDefense:
			Cfg.ColorHex = TEXT("#FFD700");
			Cfg.LinearColor = FLinearColor(1.0f, 0.843f, 0.0f, 1.0f);
			Cfg.HitStopDurationSeconds = 0.120f;
			Cfg.CustomTimeDilation = 0.00f;
			Cfg.MeshJitterAmplitudeCm = 4.0f;
			Cfg.CameraShakeAmplitude = 1.25f;
			Cfg.CameraShakeFrequency = 35.0f;
			Cfg.NumberScaleMultiplier = 2.20f;
			break;

		case EDasiDamageType::Miss:
		default:
			Cfg.ColorHex = TEXT("#AAAAAA");
			Cfg.LinearColor = FLinearColor(0.667f, 0.667f, 0.667f, 1.0f);
			Cfg.HitStopDurationSeconds = 0.0f;
			Cfg.CustomTimeDilation = 1.0f;
			Cfg.MeshJitterAmplitudeCm = 0.0f;
			Cfg.CameraShakeAmplitude = 0.0f;
			Cfg.CameraShakeFrequency = 0.0f;
			Cfg.NumberScaleMultiplier = 0.85f;
			break;
		}

		return Cfg;
	}

	static EDasiDamageType ParseDamageTypeString(const FString& TypeStr)
	{
		if (TypeStr.Equals(TEXT("SKILL"), ESearchCase::IgnoreCase)) return EDasiDamageType::Skill;
		if (TypeStr.Equals(TEXT("CRITICAL"), ESearchCase::IgnoreCase)) return EDasiDamageType::Critical;
		if (TypeStr.Equals(TEXT("EXCELLENT"), ESearchCase::IgnoreCase)) return EDasiDamageType::Excellent;
		if (TypeStr.Equals(TEXT("IGNORE_DEFENSE"), ESearchCase::IgnoreCase)) return EDasiDamageType::IgnoreDefense;
		if (TypeStr.Equals(TEXT("MISS"), ESearchCase::IgnoreCase)) return EDasiDamageType::Miss;
		return EDasiDamageType::Normal;
	}
};
