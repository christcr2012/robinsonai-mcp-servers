#!/bin/bash
# Create OpenAI integration files

echo "Creating OpenAI tools.ts..."

mkdir -p src/categories/openai

# Create tools.ts header
cat > src/categories/openai/tools.ts << 'HEADER'
/**
 * OpenAI Tool Definitions
 * Extracted from temp-openai-mcp.ts
 */

export const OPENAI_TOOLS = [
HEADER

# Extract and format tools (lines 60-3499 - skip setupHandlers line, before the closing bracket)
sed -n '60,3499p' temp-openai-mcp.ts | \
  sed 's/^        /  /g' | \
  grep -v 'tools: \[' >> src/categories/openai/tools.ts

# Close the array
echo "];" >> src/categories/openai/tools.ts

echo "✅ Created src/categories/openai/tools.ts"

echo "Creating OpenAI handlers.ts..."

# Create handlers.ts
cat > src/categories/openai/handlers.ts << 'HEADER'
/**
 * OpenAI Handler Functions
 * Extracted from temp-openai-mcp.ts
 */

import OpenAI from 'openai';

const OPENAI_ADMIN_KEY = process.env.OPENAI_ADMIN_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const API_KEY = OPENAI_ADMIN_KEY || OPENAI_API_KEY;

if (!API_KEY) {
  console.warn('Warning: OPENAI_API_KEY or OPENAI_ADMIN_KEY environment variable not set');
}

const openai = API_KEY ? new OpenAI({ apiKey: API_KEY }) : null;

function formatResponse(data: any) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

HEADER

# Extract handler methods (lines 4115-10574) starting with formatResponse
# Skip ALL class property declarations (lines with "private [name]:")
sed -n '4115,10574p' temp-openai-mcp.ts | \
  grep -v 'private [a-zA-Z]*:' | \
  sed 's/private async /export async function openai/g' | \
  sed 's/private /export function openai/g' | \
  sed 's/this\.openai/openai/g' | \
  sed 's/this\.costManager/costManager/g' | \
  sed 's/this\.userCosts/userCosts/g' | \
  sed 's/this\.costAlerts/costAlerts/g' | \
  sed 's/this\.contentFilters/contentFilters/g' | \
  sed 's/this\.monitoringAlerts/monitoringAlerts/g' | \
  sed 's/this\.embeddingIndexes/embeddingIndexes/g' | \
  sed 's/this\.realtimeSessions/realtimeSessions/g' | \
  sed 's/this\.agentMemoryStore/agentMemoryStore/g' | \
  sed 's/this\.agentStateStore/agentStateStore/g' | \
  sed 's/this\.assistantVersionStore/assistantVersionStore/g' | \
  sed 's/this\.formatResponse/formatResponse/g' | \
  sed 's/this\.getModelUseCases/getModelUseCases/g' | \
  sed 's/this\.getModelPricingInfo/getModelPricingInfo/g' >> src/categories/openai/handlers.ts

# Add module-level variables for all the class properties
cat >> src/categories/openai/handlers.ts << 'MODULEVARS'

// Module-level state variables (originally class properties)
const userCosts: Map<string, any[]> = new Map();
const costAlerts: Map<string, any> = new Map();
const contentFilters: Map<string, any> = new Map();
const monitoringAlerts: Map<string, any> = new Map();
const embeddingIndexes: Map<string, any> = new Map();
const realtimeSessions: Map<string, any> = new Map();
const agentMemoryStore: Map<string, any> = new Map();
const agentStateStore: Map<string, any> = new Map();
const assistantVersionStore: Map<string, any[]> = new Map();
MODULEVARS

# Add CostManager stub (since we're not including it)
cat >> src/categories/openai/handlers.ts << 'COSTMANAGER'

// CostManager stub - tracks costs in memory
class CostManager {
  private costs: Array<{ timestamp: number; model: string; cost: number }> = [];

  async recordCost(model: string, cost: number) {
    this.costs.push({ timestamp: Date.now(), model, cost });
  }

  async getTotalCost() {
    return this.costs.reduce((sum, c) => sum + c.cost, 0);
  }

  async getCostsByModel() {
    const byModel: Record<string, number> = {};
    for (const c of this.costs) {
      byModel[c.model] = (byModel[c.model] || 0) + c.cost;
    }
    return byModel;
  }
}

const costManager = new CostManager();
COSTMANAGER

echo "✅ Created src/categories/openai/handlers.ts"

# Update all-tools.ts
if ! grep -q "OPENAI_TOOLS" src/all-tools.ts; then
  echo "export { OPENAI_TOOLS } from './categories/openai/tools.js';" >> src/all-tools.ts
  echo "✅ Added OPENAI_TOOLS to src/all-tools.ts"
fi

# Update generate-registry.mjs
if ! grep -q "'categories/openai/tools.ts'" scripts/generate-registry.mjs; then
  sed -i "/const TOOL_FILE_MAPPING = {/a\\  'categories/openai/tools.ts': { category: 'openai', handlerModule: './categories/openai/handlers.js', exportName: 'OPENAI_TOOLS' }," scripts/generate-registry.mjs
  echo "✅ Added OpenAI to scripts/generate-registry.mjs"
fi

echo ""
echo "🎉 OpenAI integration files created!"
echo "Next: Run 'npm run build' to compile and test"

