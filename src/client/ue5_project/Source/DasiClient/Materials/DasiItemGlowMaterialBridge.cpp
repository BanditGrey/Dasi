// ============================================================================
// DASI MMORPG - Unreal Engine 5 Client
// DasiItemGlowMaterialBridge.cpp
// Implementation of item refinement shader bridge for UE5.
// ============================================================================

#include "Materials/DasiItemGlowMaterialBridge.h"
#include "Components/MeshComponent.h"
#include "GameFramework/Actor.h"
#include "Materials/MaterialInterface.h"
#include "Materials/MaterialInstanceDynamic.h"

UDasiItemGlowMaterialBridge::UDasiItemGlowMaterialBridge()
	: RefineLevel(0)
	, AuraColorPrimary(FLinearColor(1.0f, 0.82f, 0.35f, 1.0f))
	, AuraColorSecondary(FLinearColor(0.25f, 0.70f, 1.0f, 1.0f))
	, RunicPulseSpeed(1.5f)
	, ArcDispersion(0.0f)
	, CoronaIntensity(0.0f)
	, HeatHazeStrength(0.0f)
	, bAutoRegisterParentMesh(true)
	, bUsePresetProfiles(true)
	, ParamRefineLevel(TEXT("RefineLevel"))
	, ParamGlobalTime(TEXT("GlobalTime"))
	, ParamAuraColorPrimary(TEXT("AuraColorPrimary"))
	, ParamAuraColorSecondary(TEXT("AuraColorSecondary"))
	, ParamRunicPulseSpeed(TEXT("RunicPulseSpeed"))
	, ParamArcDispersion(TEXT("ArcDispersion"))
	, ParamCoronaIntensity(TEXT("CoronaIntensity"))
	, ParamHeatHazeStrength(TEXT("HeatHazeStrength"))
	, InternalTimeAccumulator(0.0f)
{
	PrimaryComponentTick.bCanEverTick = true;
	PrimaryComponentTick.bStartWithTickEnabled = false; // Only ticks if level >= 7 for animation
}

void UDasiItemGlowMaterialBridge::BeginPlay()
{
	Super::BeginPlay();

	if (bAutoRegisterParentMesh && GetOwner())
	{
		TArray<UMeshComponent*> FoundMeshes;
		GetOwner()->GetComponents<UMeshComponent>(FoundMeshes);

		for (UMeshComponent* Mesh : FoundMeshes)
		{
			if (Mesh)
			{
				RegisterMeshComponent(Mesh);
			}
		}
	}

	SetRefineLevel(RefineLevel);
}

void UDasiItemGlowMaterialBridge::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
	Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

	if (RefineLevel < 7)
	{
		return;
	}

	InternalTimeAccumulator += DeltaTime;

	// Push time and dynamic pulsations to MIDs
	for (UMaterialInstanceDynamic* MID : DynamicMaterials)
	{
		if (MID)
		{
			MID->SetScalarParameterValue(ParamGlobalTime, InternalTimeAccumulator);
		}
	}
}

void UDasiItemGlowMaterialBridge::SetRefineLevel(int32 InLevel)
{
	int32 ClampedLevel = FMath::Clamp(InLevel, 0, 15);
	int32 OldLevel = RefineLevel;
	RefineLevel = ClampedLevel;

	if (bUsePresetProfiles)
	{
		ApplyTierDefaults(RefineLevel);
	}

	// Dynamic ticking optimization: only tick if effects are animated (+7 to +15)
	bool bNeedsTick = (RefineLevel >= 7);
	SetComponentTickEnabled(bNeedsTick);

	PushParametersToMaterials();

	if (OldLevel != RefineLevel)
	{
		OnRefinementLevelChanged.Broadcast(OldLevel, RefineLevel);
	}
}

void UDasiItemGlowMaterialBridge::SetCustomAuraColors(const FLinearColor& Primary, const FLinearColor& Secondary)
{
	AuraColorPrimary = Primary;
	AuraColorSecondary = Secondary;
	bUsePresetProfiles = false;

	PushParametersToMaterials();
}

void UDasiItemGlowMaterialBridge::RegisterMeshComponent(UMeshComponent* TargetMesh)
{
	if (!TargetMesh)
	{
		return;
	}

	if (RegisteredMeshes.Contains(TargetMesh))
	{
		return;
	}

	RegisteredMeshes.Add(TargetMesh);
	BuildMIDsForMesh(TargetMesh);
	PushParametersToMaterials();
}

void UDasiItemGlowMaterialBridge::UnregisterMeshComponent(UMeshComponent* TargetMesh)
{
	if (!TargetMesh)
	{
		return;
	}

	RegisteredMeshes.Remove(TargetMesh);

	// Rebuild cached dynamic material list from remaining meshes
	DynamicMaterials.Empty();
	for (TWeakObjectPtr<UMeshComponent>& MeshPtr : RegisteredMeshes)
	{
		if (MeshPtr.IsValid())
		{
			BuildMIDsForMesh(MeshPtr.Get());
		}
	}

	PushParametersToMaterials();
}

void UDasiItemGlowMaterialBridge::ClearAllRegisteredMeshes()
{
	RegisteredMeshes.Empty();
	DynamicMaterials.Empty();
}

void UDasiItemGlowMaterialBridge::ForceUpdateMaterials()
{
	PushParametersToMaterials();
}

void UDasiItemGlowMaterialBridge::ApplyTierDefaults(int32 Level)
{
	switch (Level)
	{
	case 0:
	case 1:
	case 2:
	case 3:
	case 4:
	case 5:
	case 6:
		// Natural PBR appearance - no magical emission
		AuraColorPrimary   = FLinearColor(0.0f, 0.0f, 0.0f, 0.0f);
		AuraColorSecondary = FLinearColor(0.0f, 0.0f, 0.0f, 0.0f);
		RunicPulseSpeed    = 0.0f;
		ArcDispersion      = 0.0f;
		CoronaIntensity    = 0.0f;
		HeatHazeStrength   = 0.0f;
		break;

	case 7:
	case 8:
		// Tier 1: Runic Awakening (+7, +8)
		// Warm Golden-Amber breathing pulse inside engravings
		AuraColorPrimary   = FLinearColor(1.0f, 0.80f, 0.25f, 1.0f);
		AuraColorSecondary = FLinearColor(0.3f, 0.70f, 1.0f, 1.0f);
		RunicPulseSpeed    = 1.5f + (Level - 7) * 0.3f;
		ArcDispersion      = 0.0f;
		CoronaIntensity    = 0.6f + (Level - 7) * 0.4f;
		HeatHazeStrength   = 0.0f;
		break;

	case 9:
	case 10:
		// Tier 2: Aura of Might (+9, +10)
		// Radiant Golden-Orange edge aura + diamond crystal sparkles
		AuraColorPrimary   = FLinearColor(1.0f, 0.65f, 0.05f, 1.0f);
		AuraColorSecondary = FLinearColor(0.15f, 0.85f, 1.0f, 1.0f);
		RunicPulseSpeed    = 2.2f + (Level - 9) * 0.5f;
		ArcDispersion      = 0.25f;
		CoronaIntensity    = 2.5f + (Level - 9) * 1.0f;
		HeatHazeStrength   = 0.0f;
		break;

	case 11:
	case 12:
		// Tier 3: Prismatic Energy Wave (+11, +12)
		// Sinusoidal chromatic waves & micro-arcs
		AuraColorPrimary   = FLinearColor(0.05f, 0.85f, 1.0f, 1.0f); // High-voltage Cyan
		AuraColorSecondary = FLinearColor(0.85f, 0.15f, 1.0f, 1.0f); // Violet electric arc
		RunicPulseSpeed    = 3.2f + (Level - 11) * 0.6f;
		ArcDispersion      = 0.75f + (Level - 11) * 0.25f;
		CoronaIntensity    = 4.5f + (Level - 11) * 1.5f;
		HeatHazeStrength   = 0.15f;
		break;

	case 13:
	case 14:
		// Tier 4: Ascended Divine (+13, +14)
		// Blinding Corona, turbulent heat-haze & prismatic lightning
		AuraColorPrimary   = FLinearColor(1.0f, 0.15f, 0.45f, 1.0f); // Chaos Ruby/Magenta
		AuraColorSecondary = FLinearColor(1.0f, 0.90f, 0.30f, 1.0f); // Divine Solar Gold
		RunicPulseSpeed    = 4.0f + (Level - 13) * 0.8f;
		ArcDispersion      = 1.10f;
		CoronaIntensity    = 8.0f + (Level - 13) * 2.5f;
		HeatHazeStrength   = 0.65f + (Level - 13) * 0.25f;
		break;

	case 15:
		// Tier 5: Celestial Sovereign (+15 Pinnacle)
		// Multi-chromatic white-gold rainbow brilliance with intense heat haze
		AuraColorPrimary   = FLinearColor(1.0f, 0.95f, 0.75f, 1.0f); // Luminous Godly Core
		AuraColorSecondary = FLinearColor(0.40f, 0.10f, 1.0f, 1.0f); // Deep Cosmic Astral Blue
		RunicPulseSpeed    = 5.5f;
		ArcDispersion      = 1.50f;
		CoronaIntensity    = 14.0f;
		HeatHazeStrength   = 1.00f;
		break;

	default:
		break;
	}
}

void UDasiItemGlowMaterialBridge::BuildMIDsForMesh(UMeshComponent* Mesh)
{
	if (!Mesh)
	{
		return;
	}

	const int32 NumMaterials = Mesh->GetNumMaterials();
	for (int32 SlotIdx = 0; SlotIdx < NumMaterials; ++SlotIdx)
	{
		UMaterialInterface* CurrentMat = Mesh->GetMaterial(SlotIdx);
		if (!CurrentMat)
		{
			continue;
		}

		// Avoid duplicate MID creation if already a MID
		UMaterialInstanceDynamic* MID = Cast<UMaterialInstanceDynamic>(CurrentMat);
		if (!MID)
		{
			MID = Mesh->CreateAndSetMaterialInstanceDynamic(SlotIdx);
		}

		if (MID && !DynamicMaterials.Contains(MID))
		{
			DynamicMaterials.Add(MID);
		}
	}
}

void UDasiItemGlowMaterialBridge::PushParametersToMaterials()
{
	for (int32 i = DynamicMaterials.Num() - 1; i >= 0; --i)
	{
		UMaterialInstanceDynamic* MID = DynamicMaterials[i];
		if (!MID || !MID->IsValidLowLevel())
		{
			DynamicMaterials.RemoveAt(i);
			continue;
		}

		MID->SetScalarParameterValue(ParamRefineLevel, static_cast<float>(RefineLevel));
		MID->SetScalarParameterValue(ParamGlobalTime, InternalTimeAccumulator);
		MID->SetVectorParameterValue(ParamAuraColorPrimary, AuraColorPrimary);
		MID->SetVectorParameterValue(ParamAuraColorSecondary, AuraColorSecondary);
		MID->SetScalarParameterValue(ParamRunicPulseSpeed, RunicPulseSpeed);
		MID->SetScalarParameterValue(ParamArcDispersion, ArcDispersion);
		MID->SetScalarParameterValue(ParamCoronaIntensity, CoronaIntensity);
		MID->SetScalarParameterValue(ParamHeatHazeStrength, HeatHazeStrength);
	}
}
