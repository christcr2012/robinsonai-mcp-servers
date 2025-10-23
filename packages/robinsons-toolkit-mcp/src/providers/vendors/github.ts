import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const id = 'github';

let client: any = null;

export function catalog(): Tool[] {
  return [
    {
      name: 'create_repository',
      description: 'Create a new GitHub repository',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Repository name' },
          description: { type: 'string', description: 'Repository description' },
          private: { type: 'boolean', description: 'Make repository private' }
        },
        required: ['name']
      }
    },
    {
      name: 'create_issue',
      description: 'Create a GitHub issue',
      inputSchema: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          title: { type: 'string', description: 'Issue title' },
          body: { type: 'string', description: 'Issue body' }
        },
        required: ['owner', 'repo', 'title']
      }
    },
    {
      name: 'create_pull_request',
      description: 'Create a GitHub pull request',
      inputSchema: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          title: { type: 'string', description: 'PR title' },
          head: { type: 'string', description: 'Branch to merge from' },
          base: { type: 'string', description: 'Branch to merge into' },
          body: { type: 'string', description: 'PR description' }
        },
        required: ['owner', 'repo', 'title', 'head', 'base']
      }
    },
    {
      name: 'list_repositories',
      description: 'List user repositories',
      inputSchema: {
        type: 'object',
        properties: {
          username: { type: 'string', description: 'GitHub username' },
          type: { type: 'string', enum: ['all', 'owner', 'member'], description: 'Repository type' }
        }
      }
    },
    {
      name: 'get_repository',
      description: 'Get repository details',
      inputSchema: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' }
        },
        required: ['owner', 'repo']
      }
    }
  ];
}

export function missingEnv(): string[] {
  return ['GITHUB_TOKEN'].filter(k => !process.env[k]);
}

export async function ensureClient() {
  if (missingEnv().length === 0 && !client) {
    // Initialize GitHub client (using Octokit or similar)
    const { Octokit } = await import('@octokit/rest');
    client = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }
}

export function isReady(): boolean {
  return client !== null;
}

export async function call(name: string, args: any) {
  if (!client) {
    return { content: [{ type: 'text', text: 'GitHub client not initialized' }] };
  }

  try {
    let result: any;

    switch (name) {
      case 'create_repository':
        result = await client.repos.createForAuthenticatedUser({
          name: args.name,
          description: args.description,
          private: args.private ?? false
        });
        break;

      case 'create_issue':
        result = await client.issues.create({
          owner: args.owner,
          repo: args.repo,
          title: args.title,
          body: args.body
        });
        break;

      case 'create_pull_request':
        result = await client.pulls.create({
          owner: args.owner,
          repo: args.repo,
          title: args.title,
          head: args.head,
          base: args.base,
          body: args.body
        });
        break;

      case 'list_repositories':
        if (args.username) {
          result = await client.repos.listForUser({
            username: args.username,
            type: args.type || 'all'
          });
        } else {
          result = await client.repos.listForAuthenticatedUser({
            type: args.type || 'all'
          });
        }
        break;

      case 'get_repository':
        result = await client.repos.get({
          owner: args.owner,
          repo: args.repo
        });
        break;

      default:
        return { content: [{ type: 'text', text: `Unknown GitHub tool: ${name}` }] };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result.data, null, 2)
      }]
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `GitHub API error: ${error.message}`
      }]
    };
  }
}

