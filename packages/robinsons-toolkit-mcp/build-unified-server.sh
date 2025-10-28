#!/bin/bash
# Build the unified server by concatenating all extracted pieces

echo "Building unified server..."

# Start with imports
sed -n '1,23p' src/index.ts > src/index-new.ts

# Add constants
cat >> src/index-new.ts << 'EOF'

// Vercel API constants
const BASE_URL = 'https://api.vercel.com';

class UnifiedToolkit {
  private server: Server;
  private githubToken: string;
  private vercelToken: string;
  private neonApiKey: string;

  constructor() {
    this.githubToken = process.env.GITHUB_TOKEN || '';
    this.vercelToken = process.env.VERCEL_TOKEN || '';
    this.neonApiKey = process.env.NEON_API_KEY || '';

    this.server = new Server(
      {
        name: "robinsons-toolkit",
        version: "0.1.1",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers() {
    // List all 563 tools (GitHub 240 + Vercel 150 + Neon 173)
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
EOF

# Add GitHub tools
cat temp-github-tools.txt >> src/index-new.ts
echo "," >> src/index-new.ts

# Add Vercel tools
cat temp-vercel-tools.txt >> src/index-new.ts
echo "," >> src/index-new.ts

# Add Neon tools
cat temp-neon-tools-new.txt >> src/index-new.ts

# Close tools array and add call handler
cat >> src/index-new.ts << 'EOF'
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
EOF

# Add GitHub cases (skip the first 3 lines which have the switch statement)
tail -n +4 temp-github-call.txt | head -n -4 >> src/index-new.ts

# Add Vercel cases
tail -n +4 temp-vercel-call.txt | head -n -4 >> src/index-new.ts

# Add Neon cases
tail -n +4 temp-neon-call.txt | head -n -4 >> src/index-new.ts

# Close switch and add error handling
cat >> src/index-new.ts << 'EOF'
          default:
            return {
              content: [{ type: "text", text: `Unknown tool: ${name}` }],
            };
        }
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });
  }

  // Helper methods
  private formatResponse(data: any): { content: Array<{ type: string; text: string }> } {
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }

  private get token(): string {
    return this.neonApiKey;
  }

  private async vercelFetch(endpoint: string, options: any = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.vercelToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    return await response.json();
  }

  // All methods from GitHub, Vercel, and Neon
EOF

# Add all methods (GitHub first, then unique ones from Vercel and Neon)
cat temp-github-methods.txt >> src/index-new.ts
echo "" >> src/index-new.ts
cat temp-vercel-methods.txt >> src/index-new.ts
echo "" >> src/index-new.ts
cat temp-neon-methods.txt >> src/index-new.ts

# Close class and add instantiation
cat >> src/index-new.ts << 'EOF'

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Robinson's Toolkit MCP server running on stdio");
    console.error("Total tools: 563 (GitHub: 240, Vercel: 150, Neon: 173)");
  }
}

const toolkit = new UnifiedToolkit();
toolkit.run().catch(console.error);
EOF

echo "✅ Built src/index-new.ts"
wc -l src/index-new.ts
