/**
 * Ops-based generator module for Free Agent MCP
 * Exports a GeneratorFactory that creates generators using the ops+anchors+gates pipeline
 */
import type { GeneratorFactory, GenRequest, GenResult } from '../../generation/types.js';
import { OpsMCPGenerator } from '../../generation/ops-mcp-generator.js';

/**
 * Create a generator instance with the ops+anchors+gates pipeline
 */
export const createGenerator: GeneratorFactory = (deps: Record<string, any> = {}) => {
  const logger = deps.logger || console;

  // Create the OpsMCPGenerator instance
  const opsGen = new OpsMCPGenerator();
  
  return {
    async generate(req: GenRequest): Promise<GenResult> {
      logger.log('[OpsGenerator] Starting ops-based generation...');
      
      try {
        // Use the OpsGenerator to create the diff
        const diff = await opsGen.generate({
          repo: req.repo,
          task: req.task,
          contract: req.patternContract || { containers: [], wrappers: [] },
          examples: req.examples || [],
          targets: req.targets || [],
          tier: req.tier || 'free',
          quality: req.quality || 'auto',
        });
        
        logger.log('[OpsGenerator] Successfully generated diff');
        
        return {
          diff,
          meta: {
            generator: 'ops',
            quality: req.quality || 'auto',
            tier: req.tier || 'free',
          },
        };
      } catch (error) {
        logger.error('[OpsGenerator] Generation failed:', error);
        throw error;
      }
    },
  };
};

export default createGenerator;

