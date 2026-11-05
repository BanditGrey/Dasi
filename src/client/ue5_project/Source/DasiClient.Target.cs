using UnrealBuildTool;
using System.Collections.Generic;

public class DasiClientTarget : TargetRules
{
	public DasiClientTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.V5;
		IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_4;
		ExtraModuleNames.AddRange(new string[] { "DasiClient" });
	}
}
