#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Get Vercel token from command line argument or environment variable
const VERCEL_TOKEN = process.argv[2] || process.env.VERCEL_TOKEN || "";
const BASE_URL = "https://api.vercel.com";

if (!VERCEL_TOKEN) {
  console.error("Error: Vercel token required!");
  console.error("Usage: vercel-mcp <VERCEL_TOKEN>");
  console.error("Or set VERCEL_TOKEN environment variable");
  process.exit(1);
}

class VercelMCP {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "@robinsonai/vercel-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // ==================== PROJECT MANAGEMENT ====================
        {
          name: "vercel_list_projects",
          description: "List all Vercel projects",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_get_project",
          description: "Get details of a specific project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_create_project",
          description: "Create a new Vercel project",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Project name" },
              framework: { type: "string", description: "Framework (nextjs, react, etc.)" },
              gitRepository: {
                type: "object",
                description: "Git repository to connect",
                properties: {
                  type: { type: "string", enum: ["github", "gitlab", "bitbucket"] },
                  repo: { type: "string", description: "Repository path (owner/repo)" },
                },
              },
            },
            required: ["name"],
          },
        },
        {
          name: "vercel_update_project",
          description: "Update project settings",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              name: { type: "string", description: "New project name" },
              framework: { type: "string", description: "Framework" },
              buildCommand: { type: "string", description: "Build command" },
              outputDirectory: { type: "string", description: "Output directory" },
              installCommand: { type: "string", description: "Install command" },
              devCommand: { type: "string", description: "Dev command" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_delete_project",
          description: "Delete a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
            },
            required: ["projectId"],
          },
        },

        // ==================== DEPLOYMENT MANAGEMENT ====================
        {
          name: "vercel_list_deployments",
          description: "List deployments for a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              limit: { type: "number", description: "Number of deployments (default: 20)" },
              state: { type: "string", enum: ["BUILDING", "ERROR", "INITIALIZING", "QUEUED", "READY", "CANCELED"], description: "Filter by state" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_deployment",
          description: "Get details of a specific deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID or URL" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_create_deployment",
          description: "Create a new deployment",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              gitSource: {
                type: "object",
                description: "Git source to deploy",
                properties: {
                  type: { type: "string", enum: ["github", "gitlab", "bitbucket"] },
                  ref: { type: "string", description: "Branch, tag, or commit SHA" },
                },
              },
              target: { type: "string", enum: ["production", "preview"], description: "Deployment target" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_cancel_deployment",
          description: "Cancel a running deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_delete_deployment",
          description: "Delete a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_get_deployment_events",
          description: "Get build events/logs for a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              follow: { type: "boolean", description: "Follow logs in real-time" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_redeploy",
          description: "Redeploy an existing deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID to redeploy" },
              target: { type: "string", enum: ["production", "preview"], description: "Target environment" },
            },
            required: ["deploymentId"],
          },
        },

        // ==================== ENVIRONMENT VARIABLES ====================
        {
          name: "vercel_list_env_vars",
          description: "List environment variables for a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_create_env_var",
          description: "Create an environment variable",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              key: { type: "string", description: "Variable name" },
              value: { type: "string", description: "Variable value" },
              target: {
                type: "array",
                items: { type: "string", enum: ["production", "preview", "development"] },
                description: "Target environments",
              },
              type: { type: "string", enum: ["plain", "secret", "encrypted", "system"], description: "Variable type" },
            },
            required: ["projectId", "key", "value", "target"],
          },
        },
        {
          name: "vercel_update_env_var",
          description: "Update an environment variable",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              envId: { type: "string", description: "Environment variable ID" },
              value: { type: "string", description: "New value" },
              target: {
                type: "array",
                items: { type: "string", enum: ["production", "preview", "development"] },
                description: "Target environments",
              },
            },
            required: ["projectId", "envId"],
          },
        },
        {
          name: "vercel_delete_env_var",
          description: "Delete an environment variable",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              envId: { type: "string", description: "Environment variable ID" },
            },
            required: ["projectId", "envId"],
          },
        },
        {
          name: "vercel_bulk_create_env_vars",
          description: "Create multiple environment variables at once",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              variables: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string" },
                    value: { type: "string" },
                    target: { type: "array", items: { type: "string" } },
                    type: { type: "string" },
                  },
                },
                description: "Array of environment variables",
              },
            },
            required: ["projectId", "variables"],
          },
        },

        // ==================== DOMAIN MANAGEMENT ====================
        {
          name: "vercel_list_domains",
          description: "List all domains",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_get_domain",
          description: "Get details of a specific domain",
          inputSchema: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain name" },
            },
            required: ["domain"],
          },
        },
        {
          name: "vercel_add_domain",
          description: "Add a domain to a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              domain: { type: "string", description: "Domain name" },
            },
            required: ["projectId", "domain"],
          },
        },
        {
          name: "vercel_remove_domain",
          description: "Remove a domain from a project",
          inputSchema: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain name" },
            },
            required: ["domain"],
          },
        },
        {
          name: "vercel_verify_domain",
          description: "Verify domain ownership",
          inputSchema: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain name" },
            },
            required: ["domain"],
          },
        },

        // ==================== DNS MANAGEMENT ====================
        {
          name: "vercel_list_dns_records",
          description: "List DNS records for a domain",
          inputSchema: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain name" },
            },
            required: ["domain"],
          },
        },
        {
          name: "vercel_create_dns_record",
          description: "Create a DNS record",
          inputSchema: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain name" },
              type: { type: "string", enum: ["A", "AAAA", "ALIAS", "CAA", "CNAME", "MX", "SRV", "TXT"], description: "Record type" },
              name: { type: "string", description: "Record name" },
              value: { type: "string", description: "Record value" },
              ttl: { type: "number", description: "TTL in seconds" },
            },
            required: ["domain", "type", "name", "value"],
          },
        },
        {
          name: "vercel_delete_dns_record",
          description: "Delete a DNS record",
          inputSchema: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain name" },
              recordId: { type: "string", description: "DNS record ID" },
            },
            required: ["domain", "recordId"],
          },
        },

        // ==================== TEAM MANAGEMENT ====================
        {
          name: "vercel_list_teams",
          description: "List all teams",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "vercel_get_team",
          description: "Get team details",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Team ID" },
            },
            required: ["teamId"],
          },
        },
        {
          name: "vercel_list_team_members",
          description: "List team members",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Team ID" },
            },
            required: ["teamId"],
          },
        },

        // ==================== LOGS & MONITORING ====================
        {
          name: "vercel_get_deployment_logs",
          description: "Get runtime logs for a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              limit: { type: "number", description: "Number of log entries" },
              since: { type: "number", description: "Timestamp to start from" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_get_project_analytics",
          description: "Get analytics data for a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
            },
            required: ["projectId"],
          },
        },

        // ==================== EDGE CONFIG ====================
        {
          name: "vercel_list_edge_configs",
          description: "List all Edge Configs",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_create_edge_config",
          description: "Create an Edge Config",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Edge Config name" },
            },
            required: ["name"],
          },
        },
        {
          name: "vercel_get_edge_config_items",
          description: "Get items from an Edge Config",
          inputSchema: {
            type: "object",
            properties: {
              edgeConfigId: { type: "string", description: "Edge Config ID" },
            },
            required: ["edgeConfigId"],
          },
        },
        {
          name: "vercel_update_edge_config_items",
          description: "Update items in an Edge Config",
          inputSchema: {
            type: "object",
            properties: {
              edgeConfigId: { type: "string", description: "Edge Config ID" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    operation: { type: "string", enum: ["create", "update", "delete"] },
                    key: { type: "string" },
                    value: { type: "string" },
                  },
                },
              },
            },
            required: ["edgeConfigId", "items"],
          },
        },

        // ==================== WEBHOOKS ====================
        {
          name: "vercel_list_webhooks",
          description: "List webhooks for a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_create_webhook",
          description: "Create a webhook",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              url: { type: "string", description: "Webhook URL" },
              events: {
                type: "array",
                items: { type: "string" },
                description: "Events to trigger webhook",
              },
            },
            required: ["projectId", "url", "events"],
          },
        },
        {
          name: "vercel_delete_webhook",
          description: "Delete a webhook",
          inputSchema: {
            type: "object",
            properties: {
              webhookId: { type: "string", description: "Webhook ID" },
            },
            required: ["webhookId"],
          },
        },

        // ==================== ALIASES ====================
        {
          name: "vercel_list_aliases",
          description: "List all deployment aliases",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Optional project ID to filter" },
              limit: { type: "number", description: "Number of aliases to return" },
            },
          },
        },
        {
          name: "vercel_assign_alias",
          description: "Assign an alias to a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              alias: { type: "string", description: "Alias domain" },
            },
            required: ["deploymentId", "alias"],
          },
        },
        {
          name: "vercel_delete_alias",
          description: "Delete an alias",
          inputSchema: {
            type: "object",
            properties: {
              aliasId: { type: "string", description: "Alias ID or domain" },
            },
            required: ["aliasId"],
          },
        },

        // ==================== SECRETS ====================
        {
          name: "vercel_list_secrets",
          description: "List all secrets",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_create_secret",
          description: "Create a new secret",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Secret name" },
              value: { type: "string", description: "Secret value" },
              teamId: { type: "string", description: "Optional team ID" },
            },
            required: ["name", "value"],
          },
        },
        {
          name: "vercel_delete_secret",
          description: "Delete a secret",
          inputSchema: {
            type: "object",
            properties: {
              nameOrId: { type: "string", description: "Secret name or ID" },
              teamId: { type: "string", description: "Optional team ID" },
            },
            required: ["nameOrId"],
          },
        },
        {
          name: "vercel_rename_secret",
          description: "Rename a secret",
          inputSchema: {
            type: "object",
            properties: {
              nameOrId: { type: "string", description: "Current secret name or ID" },
              newName: { type: "string", description: "New secret name" },
              teamId: { type: "string", description: "Optional team ID" },
            },
            required: ["nameOrId", "newName"],
          },
        },

        // ==================== CHECKS ====================
        {
          name: "vercel_list_checks",
          description: "List checks for a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_create_check",
          description: "Create a check for a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              name: { type: "string", description: "Check name" },
              path: { type: "string", description: "Path to check" },
              status: { type: "string", description: "Check status (running, completed)" },
              conclusion: { type: "string", description: "Check conclusion (succeeded, failed, skipped)" },
            },
            required: ["deploymentId", "name"],
          },
        },
        {
          name: "vercel_update_check",
          description: "Update a check",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              checkId: { type: "string", description: "Check ID" },
              status: { type: "string", description: "Check status" },
              conclusion: { type: "string", description: "Check conclusion" },
            },
            required: ["deploymentId", "checkId"],
          },
        },

        // ==================== DEPLOYMENT FILES ====================
        {
          name: "vercel_list_deployment_files",
          description: "List files in a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_get_deployment_file",
          description: "Get a specific file from a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              fileId: { type: "string", description: "File ID" },
            },
            required: ["deploymentId", "fileId"],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Projects
          case "vercel_list_projects":
            return await this.listProjects(args);
          case "vercel_get_project":
            return await this.getProject(args);
          case "vercel_create_project":
            return await this.createProject(args);
          case "vercel_update_project":
            return await this.updateProject(args);
          case "vercel_delete_project":
            return await this.deleteProject(args);

          // Deployments
          case "vercel_list_deployments":
            return await this.listDeployments(args);
          case "vercel_get_deployment":
            return await this.getDeployment(args);
          case "vercel_create_deployment":
            return await this.createDeployment(args);
          case "vercel_cancel_deployment":
            return await this.cancelDeployment(args);
          case "vercel_delete_deployment":
            return await this.deleteDeployment(args);
          case "vercel_get_deployment_events":
            return await this.getDeploymentEvents(args);
          case "vercel_redeploy":
            return await this.redeploy(args);

          // Environment Variables
          case "vercel_list_env_vars":
            return await this.listEnvVars(args);
          case "vercel_create_env_var":
            return await this.createEnvVar(args);
          case "vercel_update_env_var":
            return await this.updateEnvVar(args);
          case "vercel_delete_env_var":
            return await this.deleteEnvVar(args);
          case "vercel_bulk_create_env_vars":
            return await this.bulkCreateEnvVars(args);

          // Domains
          case "vercel_list_domains":
            return await this.listDomains(args);
          case "vercel_get_domain":
            return await this.getDomain(args);
          case "vercel_add_domain":
            return await this.addDomain(args);
          case "vercel_remove_domain":
            return await this.removeDomain(args);
          case "vercel_verify_domain":
            return await this.verifyDomain(args);

          // DNS
          case "vercel_list_dns_records":
            return await this.listDnsRecords(args);
          case "vercel_create_dns_record":
            return await this.createDnsRecord(args);
          case "vercel_delete_dns_record":
            return await this.deleteDnsRecord(args);

          // Teams
          case "vercel_list_teams":
            return await this.listTeams(args);
          case "vercel_get_team":
            return await this.getTeam(args);
          case "vercel_list_team_members":
            return await this.listTeamMembers(args);

          // Logs & Monitoring
          case "vercel_get_deployment_logs":
            return await this.getDeploymentLogs(args);
          case "vercel_get_project_analytics":
            return await this.getProjectAnalytics(args);

          // Edge Config
          case "vercel_list_edge_configs":
            return await this.listEdgeConfigs(args);
          case "vercel_create_edge_config":
            return await this.createEdgeConfig(args);
          case "vercel_get_edge_config_items":
            return await this.getEdgeConfigItems(args);
          case "vercel_update_edge_config_items":
            return await this.updateEdgeConfigItems(args);

          // Webhooks
          case "vercel_list_webhooks":
            return await this.listWebhooks(args);
          case "vercel_create_webhook":
            return await this.createWebhook(args);
          case "vercel_delete_webhook":
            return await this.deleteWebhook(args);

          // Aliases
          case "vercel_list_aliases":
            return await this.listAliases(args);
          case "vercel_assign_alias":
            return await this.assignAlias(args);
          case "vercel_delete_alias":
            return await this.deleteAlias(args);

          // Secrets
          case "vercel_list_secrets":
            return await this.listSecrets(args);
          case "vercel_create_secret":
            return await this.createSecret(args);
          case "vercel_delete_secret":
            return await this.deleteSecret(args);
          case "vercel_rename_secret":
            return await this.renameSecret(args);

          // Checks
          case "vercel_list_checks":
            return await this.listChecks(args);
          case "vercel_create_check":
            return await this.createCheck(args);
          case "vercel_update_check":
            return await this.updateCheck(args);

          // Deployment Files
          case "vercel_list_deployment_files":
            return await this.listDeploymentFiles(args);
          case "vercel_get_deployment_file":
            return await this.getDeploymentFile(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  // ==================== HELPER METHODS ====================

  private async vercelFetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vercel API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  private formatResponse(data: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  // ==================== PROJECT METHODS ====================

  private async listProjects(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v9/projects?${params}`);
    return this.formatResponse(data);
  }

  private async getProject(args: any) {
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`);
    return this.formatResponse(data);
  }

  private async createProject(args: any) {
    const data = await this.vercelFetch(`/v9/projects`, {
      method: "POST",
      body: JSON.stringify(args),
    });
    return this.formatResponse(data);
  }

  private async updateProject(args: any) {
    const { projectId, ...updates } = args;
    const data = await this.vercelFetch(`/v9/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return this.formatResponse(data);
  }

  private async deleteProject(args: any) {
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  // ==================== DEPLOYMENT METHODS ====================

  private async listDeployments(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit.toString());
    if (args.state) params.append("state", args.state);
    const data = await this.vercelFetch(
      `/v6/deployments?projectId=${args.projectId}&${params}`
    );
    return this.formatResponse(data);
  }

  private async getDeployment(args: any) {
    const data = await this.vercelFetch(`/v13/deployments/${args.deploymentId}`);
    return this.formatResponse(data);
  }

  private async createDeployment(args: any) {
    const data = await this.vercelFetch(`/v13/deployments`, {
      method: "POST",
      body: JSON.stringify(args),
    });
    return this.formatResponse(data);
  }

  private async cancelDeployment(args: any) {
    const data = await this.vercelFetch(
      `/v12/deployments/${args.deploymentId}/cancel`,
      { method: "PATCH" }
    );
    return this.formatResponse(data);
  }

  private async deleteDeployment(args: any) {
    const data = await this.vercelFetch(`/v13/deployments/${args.deploymentId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async getDeploymentEvents(args: any) {
    const data = await this.vercelFetch(
      `/v3/deployments/${args.deploymentId}/events`
    );
    return this.formatResponse(data);
  }

  private async redeploy(args: any) {
    const data = await this.vercelFetch(
      `/v13/deployments/${args.deploymentId}/redeploy`,
      {
        method: "POST",
        body: JSON.stringify({ target: args.target }),
      }
    );
    return this.formatResponse(data);
  }

  // ==================== ENV VAR METHODS ====================

  private async listEnvVars(args: any) {
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}/env`);
    return this.formatResponse(data);
  }

  private async createEnvVar(args: any) {
    const { projectId, ...envVar } = args;
    const data = await this.vercelFetch(`/v10/projects/${projectId}/env`, {
      method: "POST",
      body: JSON.stringify(envVar),
    });
    return this.formatResponse(data);
  }

  private async updateEnvVar(args: any) {
    const { projectId, envId, ...updates } = args;
    const data = await this.vercelFetch(`/v9/projects/${projectId}/env/${envId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return this.formatResponse(data);
  }

  private async deleteEnvVar(args: any) {
    const data = await this.vercelFetch(
      `/v9/projects/${args.projectId}/env/${args.envId}`,
      { method: "DELETE" }
    );
    return this.formatResponse(data);
  }

  private async bulkCreateEnvVars(args: any) {
    const { projectId, variables } = args;
    const results = [];
    for (const envVar of variables) {
      try {
        const data = await this.vercelFetch(`/v10/projects/${projectId}/env`, {
          method: "POST",
          body: JSON.stringify(envVar),
        });
        results.push({ success: true, key: envVar.key, data });
      } catch (error: any) {
        results.push({ success: false, key: envVar.key, error: error.message });
      }
    }
    return this.formatResponse({ results });
  }

  // ==================== DOMAIN METHODS ====================

  private async listDomains(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v5/domains?${params}`);
    return this.formatResponse(data);
  }

  private async getDomain(args: any) {
    const data = await this.vercelFetch(`/v5/domains/${args.domain}`);
    return this.formatResponse(data);
  }

  private async addDomain(args: any) {
    const data = await this.vercelFetch(`/v10/projects/${args.projectId}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: args.domain }),
    });
    return this.formatResponse(data);
  }

  private async removeDomain(args: any) {
    const data = await this.vercelFetch(`/v9/domains/${args.domain}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async verifyDomain(args: any) {
    const data = await this.vercelFetch(`/v6/domains/${args.domain}/verify`, {
      method: "POST",
    });
    return this.formatResponse(data);
  }

  // ==================== DNS METHODS ====================

  private async listDnsRecords(args: any) {
    const data = await this.vercelFetch(`/v4/domains/${args.domain}/records`);
    return this.formatResponse(data);
  }

  private async createDnsRecord(args: any) {
    const { domain, ...record } = args;
    const data = await this.vercelFetch(`/v2/domains/${domain}/records`, {
      method: "POST",
      body: JSON.stringify(record),
    });
    return this.formatResponse(data);
  }

  private async deleteDnsRecord(args: any) {
    const data = await this.vercelFetch(
      `/v2/domains/${args.domain}/records/${args.recordId}`,
      { method: "DELETE" }
    );
    return this.formatResponse(data);
  }

  // ==================== TEAM METHODS ====================

  private async listTeams(args: any) {
    const data = await this.vercelFetch(`/v2/teams`);
    return this.formatResponse(data);
  }

  private async getTeam(args: any) {
    const data = await this.vercelFetch(`/v2/teams/${args.teamId}`);
    return this.formatResponse(data);
  }

  private async listTeamMembers(args: any) {
    const data = await this.vercelFetch(`/v2/teams/${args.teamId}/members`);
    return this.formatResponse(data);
  }

  // ==================== LOGS & MONITORING METHODS ====================

  private async getDeploymentLogs(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit.toString());
    if (args.since) params.append("since", args.since.toString());
    const data = await this.vercelFetch(
      `/v2/deployments/${args.deploymentId}/events?${params}`
    );
    return this.formatResponse(data);
  }

  private async getProjectAnalytics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await this.vercelFetch(
      `/v1/projects/${args.projectId}/analytics?${params}`
    );
    return this.formatResponse(data);
  }

  // ==================== EDGE CONFIG METHODS ====================

  private async listEdgeConfigs(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/edge-config?${params}`);
    return this.formatResponse(data);
  }

  private async createEdgeConfig(args: any) {
    const data = await this.vercelFetch(`/v1/edge-config`, {
      method: "POST",
      body: JSON.stringify(args),
    });
    return this.formatResponse(data);
  }

  private async getEdgeConfigItems(args: any) {
    const data = await this.vercelFetch(
      `/v1/edge-config/${args.edgeConfigId}/items`
    );
    return this.formatResponse(data);
  }

  private async updateEdgeConfigItems(args: any) {
    const { edgeConfigId, items } = args;
    const data = await this.vercelFetch(`/v1/edge-config/${edgeConfigId}/items`, {
      method: "PATCH",
      body: JSON.stringify({ items }),
    });
    return this.formatResponse(data);
  }

  // ==================== WEBHOOK METHODS ====================

  private async listWebhooks(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/webhooks`);
    return this.formatResponse(data);
  }

  private async createWebhook(args: any) {
    const { projectId, ...webhook } = args;
    const data = await this.vercelFetch(`/v1/projects/${projectId}/webhooks`, {
      method: "POST",
      body: JSON.stringify(webhook),
    });
    return this.formatResponse(data);
  }

  private async deleteWebhook(args: any) {
    const data = await this.vercelFetch(`/v1/webhooks/${args.webhookId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  // ==================== ALIAS METHODS ====================

  private async listAliases(args: any) {
    const params = new URLSearchParams();
    if (args.projectId) params.append("projectId", args.projectId);
    if (args.limit) params.append("limit", args.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await this.vercelFetch(`/v4/aliases${query}`);
    return this.formatResponse(data);
  }

  private async assignAlias(args: any) {
    const data = await this.vercelFetch(`/v2/deployments/${args.deploymentId}/aliases`, {
      method: "POST",
      body: JSON.stringify({ alias: args.alias }),
    });
    return this.formatResponse(data);
  }

  private async deleteAlias(args: any) {
    const data = await this.vercelFetch(`/v2/aliases/${args.aliasId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  // ==================== SECRET METHODS ====================

  private async listSecrets(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await this.vercelFetch(`/v3/secrets${query}`);
    return this.formatResponse(data);
  }

  private async createSecret(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await this.vercelFetch(`/v3/secrets${query}`, {
      method: "POST",
      body: JSON.stringify({ name: args.name, value: args.value }),
    });
    return this.formatResponse(data);
  }

  private async deleteSecret(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await this.vercelFetch(`/v2/secrets/${args.nameOrId}${query}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async renameSecret(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await this.vercelFetch(`/v2/secrets/${args.nameOrId}${query}`, {
      method: "PATCH",
      body: JSON.stringify({ name: args.newName }),
    });
    return this.formatResponse(data);
  }

  // ==================== CHECK METHODS ====================

  private async listChecks(args: any) {
    const data = await this.vercelFetch(`/v1/deployments/${args.deploymentId}/checks`);
    return this.formatResponse(data);
  }

  private async createCheck(args: any) {
    const { deploymentId, ...check } = args;
    const data = await this.vercelFetch(`/v1/deployments/${deploymentId}/checks`, {
      method: "POST",
      body: JSON.stringify(check),
    });
    return this.formatResponse(data);
  }

  private async updateCheck(args: any) {
    const { deploymentId, checkId, ...update } = args;
    const data = await this.vercelFetch(`/v1/deployments/${deploymentId}/checks/${checkId}`, {
      method: "PATCH",
      body: JSON.stringify(update),
    });
    return this.formatResponse(data);
  }

  // ==================== DEPLOYMENT FILE METHODS ====================

  private async listDeploymentFiles(args: any) {
    const data = await this.vercelFetch(`/v6/deployments/${args.deploymentId}/files`);
    return this.formatResponse(data);
  }

  private async getDeploymentFile(args: any) {
    const data = await this.vercelFetch(`/v6/deployments/${args.deploymentId}/files/${args.fileId}`);
    return this.formatResponse(data);
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("@robinsonai/vercel-mcp server running on stdio");
  }
}

const server = new VercelMCP();
server.run().catch(console.error);
