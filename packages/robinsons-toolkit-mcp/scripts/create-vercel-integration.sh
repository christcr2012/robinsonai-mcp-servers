#!/bin/bash
# Create Vercel integration files

echo "Creating Vercel tools.ts..."

# Extract tools from temp-vercel-mcp.ts (lines 41-1956)
mkdir -p src/categories/vercel

# Create tools.ts header
cat > src/categories/vercel/tools.ts << 'HEADER'
/**
 * Vercel Tool Definitions
 * Extracted from temp-vercel-mcp.ts
 */

export const VERCEL_TOOLS = [
HEADER

# Extract and format tools
sed -n '43,1955p' temp-vercel-mcp.ts | \
  awk '
    BEGIN { in_tool = 0; tool = ""; }
    /^        \{/ { in_tool = 1; tool = $0; next; }
    in_tool { tool = tool "\n" $0; }
    /^        \},?$/ {
      if (in_tool) {
        # Clean up and format
        gsub(/^        /, "  ", tool);
        print tool;
        in_tool = 0;
        tool = "";
      }
    }
  ' >> src/categories/vercel/tools.ts

# Close the array
echo "];" >> src/categories/vercel/tools.ts

echo "✅ Created src/categories/vercel/tools.ts"

echo "Creating Vercel handlers.ts..."

# Create handlers.ts
cat > src/categories/vercel/handlers.ts << 'HEADER'
/**
 * Vercel Handler Functions
 * Extracted from temp-vercel-mcp.ts
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const BASE_URL = 'https://api.vercel.com';

if (!VERCEL_TOKEN) {
  console.warn('Warning: VERCEL_TOKEN environment variable not set');
}

async function vercelFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vercel API error: ${response.status} - ${error}`);
  }

  return response.json();
}

HEADER

# Extract handler methods (lines 2376-3617) and transform
sed -n '2376,3617p' temp-vercel-mcp.ts | \
  sed 's/private async /export async function vercel/g' | \
  sed 's/this\.vercelFetch/vercelFetch/g' | \
  sed 's/this\.formatResponse/formatResponse/g' | \
  sed 's/VERCEL_TOKEN/process.env.VERCEL_TOKEN/g' | \
  sed 's/BASE_URL/"https:\/\/api.vercel.com"/g' >> src/categories/vercel/handlers.ts

# Add formatResponse helper function
cat >> src/categories/vercel/handlers.ts << 'HELPER'

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
HELPER

echo "✅ Created src/categories/vercel/handlers.ts"

# Update all-tools.ts
if ! grep -q "VERCEL_TOOLS" src/all-tools.ts; then
  echo "export { VERCEL_TOOLS } from './categories/vercel/tools.js';" >> src/all-tools.ts
  echo "✅ Added VERCEL_TOOLS to src/all-tools.ts"
fi

# Update generate-registry.mjs
if ! grep -q "'categories/vercel/tools.ts'" scripts/generate-registry.mjs; then
  # Find the TOOL_FILE_MAPPING section and add Vercel
  sed -i "/const TOOL_FILE_MAPPING = {/a\\  'categories/vercel/tools.ts': { category: 'vercel', handlerModule: './categories/vercel/handlers.js', exportName: 'VERCEL_TOOLS' }," scripts/generate-registry.mjs
  echo "✅ Added Vercel to scripts/generate-registry.mjs"
fi

echo ""
echo "🎉 Vercel integration files created!"
echo "Next: Run 'npm run build' to compile and test"

