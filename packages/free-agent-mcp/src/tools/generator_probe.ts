/**
 * Generator probe tool - shows which generator module resolves and its exported keys
 */
export const generator_probe = {
  name: "generator_probe",
  description: "Shows which generator module resolves and its exported keys.",
  inputSchema: {
    type: "object" as const,
    properties: {
      generatorModule: {
        type: "string",
        description: "Generator module specifier (optional, uses config/env if not provided)"
      }
    }
  },
  async handler(args: any) {
    try {
      const { loadGenerator } = await import(
        '@robinson_ai_systems/free-agent-core/dist/generation/loader.js'
      );
      
      const spec = args.generatorModule || process.env.FREE_AGENT_GENERATOR;
      
      if (!spec) {
        return {
          success: false,
          error: "No generator specified. Set generatorModule arg or FREE_AGENT_GENERATOR env var."
        };
      }
      
      const factory = await loadGenerator(spec);
      
      return {
        success: true,
        resolved: spec,
        hasFactory: !!factory,
        factoryType: typeof factory
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }
};

