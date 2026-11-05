// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "DasiInventoryTypes.generated.h"

/**
 * Slots de Equipamento autoritativos (Paperdoll)
 */
UENUM(BlueprintType)
enum class EDasiEquipmentSlot : uint8
{
	None = 0 UMETA(DisplayName = "None"),
	Helm UMETA(DisplayName = "Helm"),
	Armor UMETA(DisplayName = "Armor"),
	Pants UMETA(DisplayName = "Pants"),
	Gloves UMETA(DisplayName = "Gloves"),
	Boots UMETA(DisplayName = "Boots"),
	WeaponRight UMETA(DisplayName = "Weapon (Right Hand)"),
	WeaponLeft UMETA(DisplayName = "Weapon (Left Hand / Shield)"),
	Wings UMETA(DisplayName = "Wings"),
	Helper UMETA(DisplayName = "Helper (Pet/Mount)"),
	Pendant UMETA(DisplayName = "Pendant"),
	RingRight UMETA(DisplayName = "Ring (Right)"),
	RingLeft UMETA(DisplayName = "Ring (Left)")
};

/**
 * Categorias de Itens
 */
UENUM(BlueprintType)
enum class EDasiItemCategory : uint8
{
	Weapon UMETA(DisplayName = "Weapon"),
	Shield UMETA(DisplayName = "Shield"),
	Helm UMETA(DisplayName = "Helm"),
	Armor UMETA(DisplayName = "Armor"),
	Pants UMETA(DisplayName = "Pants"),
	Gloves UMETA(DisplayName = "Gloves"),
	Boots UMETA(DisplayName = "Boots"),
	Wing UMETA(DisplayName = "Wing"),
	Helper UMETA(DisplayName = "Helper"),
	Ring UMETA(DisplayName = "Ring"),
	Pendant UMETA(DisplayName = "Pendant"),
	Jewel UMETA(DisplayName = "Jewel"),
	Consumable UMETA(DisplayName = "Consumable")
};

/**
 * Tipos de Localização de Itens
 */
UENUM(BlueprintType)
enum class EDasiLocationType : uint8
{
	Grid = 0 UMETA(DisplayName = "Grid (8x8)"),
	Equipment = 1 UMETA(DisplayName = "Equipment (Paperdoll)")
};

/**
 * Tipos de Joias Sagradas
 */
UENUM(BlueprintType)
enum class EDasiJewelType : uint8
{
	Blessing UMETA(DisplayName = "Jewel of Blessing"),
	Soul UMETA(DisplayName = "Jewel of Soul"),
	Life UMETA(DisplayName = "Jewel of Life"),
	Chaos UMETA(DisplayName = "Jewel of Chaos"),
	Creation UMETA(DisplayName = "Jewel of Creation"),
	Harmony UMETA(DisplayName = "Jewel of Harmony")
};

/**
 * Resultado de Refino / Upgrades
 */
UENUM(BlueprintType)
enum class EDasiUpgradeOutcome : uint8
{
	None = 0 UMETA(DisplayName = "None"),
	Success UMETA(DisplayName = "Success"),
	Failure UMETA(DisplayName = "Failure"),
	LevelDown UMETA(DisplayName = "Level Down"),
	Destroyed UMETA(DisplayName = "Destroyed"),
	NoEffect UMETA(DisplayName = "No Effect"),
	InvalidTarget UMETA(DisplayName = "Invalid Target")
};

/**
 * Bitmask de Opções Excelentes para Armas
 */
UENUM(BlueprintType, meta = (Bitflags, UseEnumValuesAsMaskValuesInEditor = "true"))
enum class EDasiWeaponExcellentOption : uint8
{
	None                  = 0,
	ManaPerKill           = 1 << 0 UMETA(DisplayName = "Recover Mana/8 after monster kill"),
	HpPerKill             = 1 << 1 UMETA(DisplayName = "Recover HP/8 after monster kill"),
	AttackSpeed7          = 1 << 2 UMETA(DisplayName = "Attack Speed +7"),
	IncreaseDmg2Percent   = 1 << 3 UMETA(DisplayName = "Increase Damage +2%"),
	IncreaseDmgPerLevel   = 1 << 4 UMETA(DisplayName = "Increase Damage +Level/20"),
	ExcellentDamage10Pct  = 1 << 5 UMETA(DisplayName = "Excellent Damage Rate +10%")
};

/**
 * Bitmask de Opções Excelentes para Armaduras e Escudos
 */
UENUM(BlueprintType, meta = (Bitflags, UseEnumValuesAsMaskValuesInEditor = "true"))
enum class EDasiArmorExcellentOption : uint8
{
	None                  = 0,
	Zen30Percent          = 1 << 0 UMETA(DisplayName = "Zen Acquisition +30%"),
	DefenseRate10Pct      = 1 << 1 UMETA(DisplayName = "Defense Rate +10%"),
	ReflectDamage5Pct     = 1 << 2 UMETA(DisplayName = "Reflect Damage +5%"),
	DamageDecrease4Pct    = 1 << 3 UMETA(DisplayName = "Damage Decrease -4%"),
	IncreaseMana4Pct      = 1 << 4 UMETA(DisplayName = "Max Mana +4%"),
	IncreaseHp4Pct        = 1 << 5 UMETA(DisplayName = "Max HP +4%")
};

/**
 * Opção Amarela da Joia da Harmonia
 */
USTRUCT(BlueprintType)
struct FDasiHarmonyOption
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Harmony")
	FString Type;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Harmony")
	int32 Level = 0; // 1 a 13

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Harmony")
	int32 Value = 0;
};

/**
 * Requisitos de Atributos para Equipar Item
 */
USTRUCT(BlueprintType)
struct FDasiItemRequirements
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Requirements")
	int32 Strength = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Requirements")
	int32 Agility = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Requirements")
	int32 Vitality = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Requirements")
	int32 Energy = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Requirements")
	int32 Command = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Requirements")
	int32 Level = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Requirements")
	TArray<FString> AllowedClasses;
};

/**
 * Definição Estática de Item (Catálogo de Itens)
 */
USTRUCT(BlueprintType)
struct FDasiItemDefinition
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Definition")
	FString Id;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Definition")
	FString Name;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Definition")
	EDasiItemCategory Category = EDasiItemCategory::Weapon;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Definition")
	int32 Width = 1; // 1 ou 2

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Definition")
	int32 Height = 1; // 1 a 4

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Definition")
	int32 BaseDurability = 20;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Definition")
	int32 MinDamage = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Definition")
	int32 MaxDamage = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Definition")
	int32 Defense = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Definition")
	int32 DefenseRate = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Definition")
	int32 AttackSpeed = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Definition")
	bool bIsTwoHanded = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Definition")
	TArray<EDasiEquipmentSlot> ValidEquipSlots;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Definition")
	FDasiItemRequirements Requirements;
};

/**
 * Instância Única de Item (com Roll de Status, Nível +0 a +15, Opções Excelentes e Joias)
 */
USTRUCT(BlueprintType)
struct FDasiItemInstance
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Instance")
	FString Uuid;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Instance")
	FString DefId;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Instance")
	int32 Level = 0; // 0 a 15

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Instance")
	int32 Durability = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Instance")
	int32 MaxDurability = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Instance")
	bool bSkill = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Instance")
	bool bLuck = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Instance")
	int32 OptionLevel = 0; // Opção da Joia da Vida (+0 a +28)

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Instance")
	int32 ExcellentMask = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Instance")
	FDasiHarmonyOption HarmonyOption;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Instance")
	bool bHasHarmonyOption = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Instance")
	bool bRotated = false;

	bool IsValid() const
	{
		return !Uuid.IsEmpty() && !DefId.IsEmpty();
	}

	bool IsExcellent() const
	{
		return ExcellentMask > 0;
	}
};

/**
 * Item posicionado na Grade 8x8
 */
USTRUCT(BlueprintType)
struct FDasiPlacedItem
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Grid")
	FDasiItemInstance Item;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Grid")
	int32 X = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Grid")
	int32 Y = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Grid")
	int32 Width = 1;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Grid")
	int32 Height = 1;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Grid")
	bool bRotated = false;
};

/**
 * Item equipado no Paperdoll
 */
USTRUCT(BlueprintType)
struct FDasiEquippedItem
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Equipment")
	EDasiEquipmentSlot Slot = EDasiEquipmentSlot::None;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item|Equipment")
	FDasiItemInstance Item;
};

/**
 * Estado Serializado Completo do Inventário e Equipamento
 */
USTRUCT(BlueprintType)
struct FDasiInventoryState
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Inventory")
	int32 Cols = 8;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Inventory")
	int32 Rows = 8;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Inventory")
	TArray<FDasiPlacedItem> Items;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Inventory")
	TArray<FDasiEquippedItem> Equipped;
};

/**
 * Funções de Utilidade para Conversão de Enums <-> FString
 */
namespace DasiInventoryUtils
{
	inline FString EquipmentSlotToString(EDasiEquipmentSlot Slot)
	{
		switch (Slot)
		{
		case EDasiEquipmentSlot::Helm: return TEXT("HELM");
		case EDasiEquipmentSlot::Armor: return TEXT("ARMOR");
		case EDasiEquipmentSlot::Pants: return TEXT("PANTS");
		case EDasiEquipmentSlot::Gloves: return TEXT("GLOVES");
		case EDasiEquipmentSlot::Boots: return TEXT("BOOTS");
		case EDasiEquipmentSlot::WeaponRight: return TEXT("WEAPON_RIGHT");
		case EDasiEquipmentSlot::WeaponLeft: return TEXT("WEAPON_LEFT");
		case EDasiEquipmentSlot::Wings: return TEXT("WINGS");
		case EDasiEquipmentSlot::Helper: return TEXT("HELPER");
		case EDasiEquipmentSlot::Pendant: return TEXT("PENDANT");
		case EDasiEquipmentSlot::RingRight: return TEXT("RING_RIGHT");
		case EDasiEquipmentSlot::RingLeft: return TEXT("RING_LEFT");
		default: return TEXT("NONE");
		}
	}

	inline EDasiEquipmentSlot StringToEquipmentSlot(const FString& SlotStr)
	{
		if (SlotStr.Equals(TEXT("HELM"), ESearchCase::IgnoreCase)) return EDasiEquipmentSlot::Helm;
		if (SlotStr.Equals(TEXT("ARMOR"), ESearchCase::IgnoreCase)) return EDasiEquipmentSlot::Armor;
		if (SlotStr.Equals(TEXT("PANTS"), ESearchCase::IgnoreCase)) return EDasiEquipmentSlot::Pants;
		if (SlotStr.Equals(TEXT("GLOVES"), ESearchCase::IgnoreCase)) return EDasiEquipmentSlot::Gloves;
		if (SlotStr.Equals(TEXT("BOOTS"), ESearchCase::IgnoreCase)) return EDasiEquipmentSlot::Boots;
		if (SlotStr.Equals(TEXT("WEAPON_RIGHT"), ESearchCase::IgnoreCase)) return EDasiEquipmentSlot::WeaponRight;
		if (SlotStr.Equals(TEXT("WEAPON_LEFT"), ESearchCase::IgnoreCase)) return EDasiEquipmentSlot::WeaponLeft;
		if (SlotStr.Equals(TEXT("WINGS"), ESearchCase::IgnoreCase)) return EDasiEquipmentSlot::Wings;
		if (SlotStr.Equals(TEXT("HELPER"), ESearchCase::IgnoreCase)) return EDasiEquipmentSlot::Helper;
		if (SlotStr.Equals(TEXT("PENDANT"), ESearchCase::IgnoreCase)) return EDasiEquipmentSlot::Pendant;
		if (SlotStr.Equals(TEXT("RING_RIGHT"), ESearchCase::IgnoreCase)) return EDasiEquipmentSlot::RingRight;
		if (SlotStr.Equals(TEXT("RING_LEFT"), ESearchCase::IgnoreCase)) return EDasiEquipmentSlot::RingLeft;
		return EDasiEquipmentSlot::None;
	}

	inline FString ItemCategoryToString(EDasiItemCategory Category)
	{
		switch (Category)
		{
		case EDasiItemCategory::Weapon: return TEXT("WEAPON");
		case EDasiItemCategory::Shield: return TEXT("SHIELD");
		case EDasiItemCategory::Helm: return TEXT("HELM");
		case EDasiItemCategory::Armor: return TEXT("ARMOR");
		case EDasiItemCategory::Pants: return TEXT("PANTS");
		case EDasiItemCategory::Gloves: return TEXT("GLOVES");
		case EDasiItemCategory::Boots: return TEXT("BOOTS");
		case EDasiItemCategory::Wing: return TEXT("WING");
		case EDasiItemCategory::Helper: return TEXT("HELPER");
		case EDasiItemCategory::Ring: return TEXT("RING");
		case EDasiItemCategory::Pendant: return TEXT("PENDANT");
		case EDasiItemCategory::Jewel: return TEXT("JEWEL");
		case EDasiItemCategory::Consumable: return TEXT("CONSUMABLE");
		default: return TEXT("CONSUMABLE");
		}
	}

	inline EDasiItemCategory StringToItemCategory(const FString& CatStr)
	{
		if (CatStr.Equals(TEXT("WEAPON"), ESearchCase::IgnoreCase)) return EDasiItemCategory::Weapon;
		if (CatStr.Equals(TEXT("SHIELD"), ESearchCase::IgnoreCase)) return EDasiItemCategory::Shield;
		if (CatStr.Equals(TEXT("HELM"), ESearchCase::IgnoreCase)) return EDasiItemCategory::Helm;
		if (CatStr.Equals(TEXT("ARMOR"), ESearchCase::IgnoreCase)) return EDasiItemCategory::Armor;
		if (CatStr.Equals(TEXT("PANTS"), ESearchCase::IgnoreCase)) return EDasiItemCategory::Pants;
		if (CatStr.Equals(TEXT("GLOVES"), ESearchCase::IgnoreCase)) return EDasiItemCategory::Gloves;
		if (CatStr.Equals(TEXT("BOOTS"), ESearchCase::IgnoreCase)) return EDasiItemCategory::Boots;
		if (CatStr.Equals(TEXT("WING"), ESearchCase::IgnoreCase)) return EDasiItemCategory::Wing;
		if (CatStr.Equals(TEXT("HELPER"), ESearchCase::IgnoreCase)) return EDasiItemCategory::Helper;
		if (CatStr.Equals(TEXT("RING"), ESearchCase::IgnoreCase)) return EDasiItemCategory::Ring;
		if (CatStr.Equals(TEXT("PENDANT"), ESearchCase::IgnoreCase)) return EDasiItemCategory::Pendant;
		if (CatStr.Equals(TEXT("JEWEL"), ESearchCase::IgnoreCase)) return EDasiItemCategory::Jewel;
		return EDasiItemCategory::Consumable;
	}

	inline EDasiUpgradeOutcome StringToUpgradeOutcome(const FString& Str)
	{
		if (Str.Equals(TEXT("SUCCESS"), ESearchCase::IgnoreCase)) return EDasiUpgradeOutcome::Success;
		if (Str.Equals(TEXT("FAILURE"), ESearchCase::IgnoreCase)) return EDasiUpgradeOutcome::Failure;
		if (Str.Equals(TEXT("LEVEL_DOWN"), ESearchCase::IgnoreCase)) return EDasiUpgradeOutcome::LevelDown;
		if (Str.Equals(TEXT("DESTROYED"), ESearchCase::IgnoreCase)) return EDasiUpgradeOutcome::Destroyed;
		if (Str.Equals(TEXT("NO_EFFECT"), ESearchCase::IgnoreCase)) return EDasiUpgradeOutcome::NoEffect;
		if (Str.Equals(TEXT("INVALID_TARGET"), ESearchCase::IgnoreCase)) return EDasiUpgradeOutcome::InvalidTarget;
		return EDasiUpgradeOutcome::None;
	}
}
