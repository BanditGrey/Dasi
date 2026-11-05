using UnrealBuildTool;

public class DasiClient : ModuleRules
{
	public DasiClient(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[] {
			"Core",
			"CoreUObject",
			"Engine",
			"InputCore",
			"EnhancedInput",
			"NavigationSystem",
			"AIModule",
			"Niagara",
			"UMG",
			"Slate",
			"SlateCore",
			"Json",
			"JsonUtilities",
			"WebSockets"
		});

		PrivateDependencyModuleNames.AddRange(new string[] {
		});
	}
}
