#!/bin/bash
# Create GitHub integration files

echo "Creating GitHub tools.ts..."

mkdir -p src/categories/github

# Create tools.ts header
cat > src/categories/github/tools.ts << 'HEADER'
/**
 * GitHub Tool Definitions
 * Extracted from temp-github-mcp.ts
 */

export const GITHUB_TOOLS = [
HEADER

# Extract and format tools (lines 77-360 - before the closing bracket)
sed -n '78,359p' temp-github-mcp.ts | \
  sed 's/^        /  /g' >> src/categories/github/tools.ts

# Close the array
echo "];" >> src/categories/github/tools.ts

echo "✅ Created src/categories/github/tools.ts"

echo "Creating GitHub handlers.ts..."

# Create handlers.ts
cat > src/categories/github/handlers.ts << 'HEADER'
/**
 * GitHub Handler Functions
 * Extracted from temp-github-mcp.ts
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || '';
const BASE_URL = 'https://api.github.com';

if (!GITHUB_TOKEN) {
  console.warn('Warning: GITHUB_TOKEN or GITHUB_PAT environment variable not set');
}

interface GitHubClient {
  get(path: string, params?: any): Promise<any>;
  post(path: string, body?: any): Promise<any>;
  patch(path: string, body?: any): Promise<any>;
  put(path: string, body?: any): Promise<any>;
  delete(path: string): Promise<any>;
}

async function githubFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${error}`);
  }

  return response.json();
}

const client: GitHubClient = {
  get: (path: string, params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return githubFetch(`${path}${query}`, { method: 'GET' });
  },
  post: (path: string, body?: any) =>
    githubFetch(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: (path: string, body?: any) =>
    githubFetch(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: (path: string, body?: any) =>
    githubFetch(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: (path: string) =>
    githubFetch(path, { method: 'DELETE' }),
};

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

# Extract handler methods (lines 676-2322) and transform
sed -n '676,2322p' temp-github-mcp.ts | \
  sed 's/private async /export async function github/g' | \
  sed 's/this\.client\./client./g' | \
  sed 's/this\.client/client/g' | \
  sed 's/this\.formatResponse/formatResponse/g' | \
  sed 's/this\.token/GITHUB_TOKEN/g' | \
  sed 's/this\.baseUrl/BASE_URL/g' >> src/categories/github/handlers.ts

echo "✅ Created src/categories/github/handlers.ts"

# Update all-tools.ts
if ! grep -q "GITHUB_TOOLS" src/all-tools.ts; then
  echo "export { GITHUB_TOOLS } from './categories/github/tools.js';" >> src/all-tools.ts
  echo "✅ Added GITHUB_TOOLS to src/all-tools.ts"
fi

# Update generate-registry.mjs
if ! grep -q "'categories/github/tools.ts'" scripts/generate-registry.mjs; then
  sed -i "/const TOOL_FILE_MAPPING = {/a\\  'categories/github/tools.ts': { category: 'github', handlerModule: './categories/github/handlers.js', exportName: 'GITHUB_TOOLS' }," scripts/generate-registry.mjs
  echo "✅ Added GitHub to scripts/generate-registry.mjs"
fi

echo ""
echo "🎉 GitHub integration files created!"
echo "Next: Run 'npm run build' to compile and test"

