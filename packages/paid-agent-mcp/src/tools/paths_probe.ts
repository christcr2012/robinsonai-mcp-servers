/**
 * Path probe tool for debugging path resolution
 */
export const paths_probe = {
  name: "paths_probe",
  description: "Resolve repo + registry absolute paths for debugging.",
  inputSchema: {
    type: "object" as const,
    required: ["repo", "registryRel"],
    properties: {
      repo: { type: "string" },
      registryRel: { type: "string" }
    }
  },
  async handler(args: any) {
    const { repo, registryRel } = args;
    
    // Import path utilities from Paid Agent's own core
    const { resolveRepoRoot, resolveFromRepo, debugPaths } = await import(
      '../core/agent-core/utils/paths.js'
    );
    
    const repoRoot = resolveRepoRoot(repo);
    const registryAbs = resolveFromRepo(repoRoot, registryRel);
    
    debugPaths("probe", { repoRoot, registryAbs });
    
    return { 
      repoRoot, 
      registryAbs,
      success: true
    };
  }
};

