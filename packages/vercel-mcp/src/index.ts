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

        // ==================== BLOB STORAGE ====================
        {
          name: "vercel_blob_list",
          description: "List blobs in Vercel Blob storage",
          inputSchema: {
            type: "object",
            properties: {
              limit: { type: "number", description: "Number of blobs to return" },
              cursor: { type: "string", description: "Pagination cursor" },
            },
          },
        },
        {
          name: "vercel_blob_put",
          description: "Upload a blob to Vercel Blob storage",
          inputSchema: {
            type: "object",
            properties: {
              pathname: { type: "string", description: "Path for the blob" },
              body: { type: "string", description: "Blob content (base64 encoded)" },
              contentType: { type: "string", description: "Content type" },
            },
            required: ["pathname", "body"],
          },
        },
        {
          name: "vercel_blob_delete",
          description: "Delete a blob from Vercel Blob storage",
          inputSchema: {
            type: "object",
            properties: {
              url: { type: "string", description: "Blob URL to delete" },
            },
            required: ["url"],
          },
        },
        {
          name: "vercel_blob_head",
          description: "Get blob metadata without downloading content",
          inputSchema: {
            type: "object",
            properties: {
              url: { type: "string", description: "Blob URL" },
            },
            required: ["url"],
          },
        },

        // ==================== KV STORAGE ====================
        {
          name: "vercel_kv_get",
          description: "Get a value from Vercel KV storage",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Key to retrieve" },
              storeId: { type: "string", description: "KV store ID" },
            },
            required: ["key", "storeId"],
          },
        },
        {
          name: "vercel_kv_set",
          description: "Set a value in Vercel KV storage",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Key to set" },
              value: { type: "string", description: "Value to store" },
              storeId: { type: "string", description: "KV store ID" },
              ex: { type: "number", description: "Expiration in seconds" },
            },
            required: ["key", "value", "storeId"],
          },
        },
        {
          name: "vercel_kv_delete",
          description: "Delete a key from Vercel KV storage",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Key to delete" },
              storeId: { type: "string", description: "KV store ID" },
            },
            required: ["key", "storeId"],
          },
        },
        {
          name: "vercel_kv_list_keys",
          description: "List keys in Vercel KV storage",
          inputSchema: {
            type: "object",
            properties: {
              storeId: { type: "string", description: "KV store ID" },
              pattern: { type: "string", description: "Key pattern to match" },
              cursor: { type: "string", description: "Pagination cursor" },
            },
            required: ["storeId"],
          },
        },

        // ==================== POSTGRES ====================
        {
          name: "vercel_postgres_list_databases",
          description: "List Vercel Postgres databases",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_postgres_create_database",
          description: "Create a Vercel Postgres database",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Database name" },
              region: { type: "string", description: "Region (e.g., us-east-1)" },
            },
            required: ["name"],
          },
        },
        {
          name: "vercel_postgres_delete_database",
          description: "Delete a Vercel Postgres database",
          inputSchema: {
            type: "object",
            properties: {
              databaseId: { type: "string", description: "Database ID" },
            },
            required: ["databaseId"],
          },
        },
        {
          name: "vercel_postgres_get_connection_string",
          description: "Get Postgres connection string",
          inputSchema: {
            type: "object",
            properties: {
              databaseId: { type: "string", description: "Database ID" },
            },
            required: ["databaseId"],
          },
        },

        // ==================== FIREWALL & SECURITY ====================
        {
          name: "vercel_list_firewall_rules",
          description: "List firewall rules (WAF)",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              teamId: { type: "string", description: "Optional team ID" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_create_firewall_rule",
          description: "Create a custom firewall rule",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              name: { type: "string", description: "Rule name" },
              action: { type: "string", description: "Action: allow, deny, challenge" },
              condition: { type: "object", description: "Rule condition" },
            },
            required: ["projectId", "name", "action"],
          },
        },
        {
          name: "vercel_update_firewall_rule",
          description: "Update a firewall rule",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              ruleId: { type: "string", description: "Rule ID" },
              name: { type: "string", description: "Rule name" },
              action: { type: "string", description: "Action: allow, deny, challenge" },
              enabled: { type: "boolean", description: "Enable/disable rule" },
            },
            required: ["projectId", "ruleId"],
          },
        },
        {
          name: "vercel_delete_firewall_rule",
          description: "Delete a firewall rule",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              ruleId: { type: "string", description: "Rule ID" },
            },
            required: ["projectId", "ruleId"],
          },
        },
        {
          name: "vercel_get_firewall_analytics",
          description: "Get firewall analytics and logs",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_list_blocked_ips",
          description: "List blocked IP addresses",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_block_ip",
          description: "Block an IP address",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              ipAddress: { type: "string", description: "IP address to block" },
              notes: { type: "string", description: "Optional notes" },
            },
            required: ["projectId", "ipAddress"],
          },
        },
        {
          name: "vercel_unblock_ip",
          description: "Unblock an IP address",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              ipAddress: { type: "string", description: "IP address to unblock" },
            },
            required: ["projectId", "ipAddress"],
          },
        },
        {
          name: "vercel_enable_attack_challenge_mode",
          description: "Enable attack challenge mode",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              enabled: { type: "boolean", description: "Enable/disable" },
            },
            required: ["projectId", "enabled"],
          },
        },
        {
          name: "vercel_get_security_events",
          description: "Get security event logs",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
              limit: { type: "number", description: "Number of events" },
            },
            required: ["projectId"],
          },
        },

        // ==================== MONITORING & OBSERVABILITY ====================
        {
          name: "vercel_get_runtime_logs_stream",
          description: "Stream runtime logs in real-time",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              follow: { type: "boolean", description: "Follow logs" },
              limit: { type: "number", description: "Number of log entries" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_get_build_logs",
          description: "Get build logs for a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_get_error_logs",
          description: "Get error logs only",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_get_bandwidth_usage",
          description: "Get bandwidth usage metrics",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_function_invocations",
          description: "Get function invocation metrics",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_cache_metrics",
          description: "Get cache performance metrics",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_traces",
          description: "Get OpenTelemetry traces",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              deploymentId: { type: "string", description: "Deployment ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_performance_insights",
          description: "Get performance insights",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_web_vitals",
          description: "Get Web Vitals metrics",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
            },
            required: ["projectId"],
          },
        },

        // ==================== BILLING & USAGE ====================
        {
          name: "vercel_get_billing_summary",
          description: "Get billing summary",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_get_usage_metrics",
          description: "Get detailed usage metrics",
          inputSchema: {
            type: "object",
            properties: {
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_get_invoice",
          description: "Get a specific invoice",
          inputSchema: {
            type: "object",
            properties: {
              invoiceId: { type: "string", description: "Invoice ID" },
            },
            required: ["invoiceId"],
          },
        },
        {
          name: "vercel_list_invoices",
          description: "List all invoices",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
              limit: { type: "number", description: "Number of invoices" },
            },
          },
        },
        {
          name: "vercel_get_spending_limits",
          description: "Get spending limits",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_update_spending_limits",
          description: "Update spending limits",
          inputSchema: {
            type: "object",
            properties: {
              maxMonthlySpend: { type: "number", description: "Maximum monthly spend" },
              teamId: { type: "string", description: "Optional team ID" },
            },
            required: ["maxMonthlySpend"],
          },
        },
        {
          name: "vercel_get_cost_breakdown",
          description: "Get cost breakdown by resource",
          inputSchema: {
            type: "object",
            properties: {
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_export_usage_report",
          description: "Export usage report",
          inputSchema: {
            type: "object",
            properties: {
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
              format: { type: "string", description: "Format: csv, json" },
              teamId: { type: "string", description: "Optional team ID" },
            },
            required: ["format"],
          },
        },

        // ==================== INTEGRATIONS & MARKETPLACE ====================
        {
          name: "vercel_list_integrations",
          description: "List installed integrations",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_get_integration",
          description: "Get integration details",
          inputSchema: {
            type: "object",
            properties: {
              integrationId: { type: "string", description: "Integration ID" },
            },
            required: ["integrationId"],
          },
        },
        {
          name: "vercel_install_integration",
          description: "Install a marketplace integration",
          inputSchema: {
            type: "object",
            properties: {
              integrationSlug: { type: "string", description: "Integration slug" },
              teamId: { type: "string", description: "Optional team ID" },
              configuration: { type: "object", description: "Integration configuration" },
            },
            required: ["integrationSlug"],
          },
        },
        {
          name: "vercel_uninstall_integration",
          description: "Uninstall an integration",
          inputSchema: {
            type: "object",
            properties: {
              integrationId: { type: "string", description: "Integration ID" },
            },
            required: ["integrationId"],
          },
        },
        {
          name: "vercel_list_integration_configurations",
          description: "List integration configurations",
          inputSchema: {
            type: "object",
            properties: {
              integrationId: { type: "string", description: "Integration ID" },
            },
            required: ["integrationId"],
          },
        },
        {
          name: "vercel_update_integration_configuration",
          description: "Update integration configuration",
          inputSchema: {
            type: "object",
            properties: {
              integrationId: { type: "string", description: "Integration ID" },
              configurationId: { type: "string", description: "Configuration ID" },
              configuration: { type: "object", description: "New configuration" },
            },
            required: ["integrationId", "configurationId", "configuration"],
          },
        },
        {
          name: "vercel_get_integration_logs",
          description: "Get integration logs",
          inputSchema: {
            type: "object",
            properties: {
              integrationId: { type: "string", description: "Integration ID" },
              limit: { type: "number", description: "Number of log entries" },
            },
            required: ["integrationId"],
          },
        },
        {
          name: "vercel_trigger_integration_sync",
          description: "Trigger integration sync",
          inputSchema: {
            type: "object",
            properties: {
              integrationId: { type: "string", description: "Integration ID" },
            },
            required: ["integrationId"],
          },
        },

        // ==================== AUDIT LOGS ====================
        {
          name: "vercel_list_audit_logs",
          description: "List audit logs",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
              limit: { type: "number", description: "Number of logs" },
            },
          },
        },
        {
          name: "vercel_get_audit_log",
          description: "Get a specific audit log entry",
          inputSchema: {
            type: "object",
            properties: {
              logId: { type: "string", description: "Log ID" },
            },
            required: ["logId"],
          },
        },
        {
          name: "vercel_export_audit_logs",
          description: "Export audit logs",
          inputSchema: {
            type: "object",
            properties: {
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
              format: { type: "string", description: "Format: csv, json" },
              teamId: { type: "string", description: "Optional team ID" },
            },
            required: ["format"],
          },
        },
        {
          name: "vercel_get_compliance_report",
          description: "Get compliance report",
          inputSchema: {
            type: "object",
            properties: {
              reportType: { type: "string", description: "Report type: soc2, gdpr, hipaa" },
              teamId: { type: "string", description: "Optional team ID" },
            },
            required: ["reportType"],
          },
        },
        {
          name: "vercel_list_access_events",
          description: "List access events",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
              userId: { type: "string", description: "Filter by user ID" },
              limit: { type: "number", description: "Number of events" },
            },
          },
        },

        // ==================== CRON JOBS ====================
        {
          name: "vercel_list_cron_jobs",
          description: "List all cron jobs",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_create_cron_job",
          description: "Create a cron job",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              path: { type: "string", description: "Function path" },
              schedule: { type: "string", description: "Cron schedule expression" },
            },
            required: ["projectId", "path", "schedule"],
          },
        },
        {
          name: "vercel_update_cron_job",
          description: "Update a cron job",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              cronId: { type: "string", description: "Cron job ID" },
              schedule: { type: "string", description: "New cron schedule" },
              enabled: { type: "boolean", description: "Enable/disable" },
            },
            required: ["projectId", "cronId"],
          },
        },
        {
          name: "vercel_delete_cron_job",
          description: "Delete a cron job",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              cronId: { type: "string", description: "Cron job ID" },
            },
            required: ["projectId", "cronId"],
          },
        },
        {
          name: "vercel_trigger_cron_job",
          description: "Manually trigger a cron job",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              cronId: { type: "string", description: "Cron job ID" },
            },
            required: ["projectId", "cronId"],
          },
        },

        // ==================== ADVANCED ROUTING ====================
        {
          name: "vercel_list_redirects",
          description: "List all redirects for a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_create_redirect",
          description: "Create a redirect rule",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              source: { type: "string", description: "Source path" },
              destination: { type: "string", description: "Destination path" },
              permanent: { type: "boolean", description: "Permanent redirect (301)" },
            },
            required: ["projectId", "source", "destination"],
          },
        },
        {
          name: "vercel_delete_redirect",
          description: "Delete a redirect rule",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              redirectId: { type: "string", description: "Redirect ID" },
            },
            required: ["projectId", "redirectId"],
          },
        },
        {
          name: "vercel_list_custom_headers",
          description: "List custom headers",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_create_custom_header",
          description: "Create a custom header",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              source: { type: "string", description: "Source path" },
              headers: { type: "array", description: "Array of header objects" },
            },
            required: ["projectId", "source", "headers"],
          },
        },
        {
          name: "vercel_delete_custom_header",
          description: "Delete a custom header",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              headerId: { type: "string", description: "Header ID" },
            },
            required: ["projectId", "headerId"],
          },
        },

        // ==================== PREVIEW COMMENTS ====================
        {
          name: "vercel_list_comments",
          description: "List deployment comments",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_create_comment",
          description: "Create a comment on a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              text: { type: "string", description: "Comment text" },
              path: { type: "string", description: "Page path" },
            },
            required: ["deploymentId", "text"],
          },
        },
        {
          name: "vercel_update_comment",
          description: "Update a comment",
          inputSchema: {
            type: "object",
            properties: {
              commentId: { type: "string", description: "Comment ID" },
              text: { type: "string", description: "New comment text" },
            },
            required: ["commentId", "text"],
          },
        },
        {
          name: "vercel_delete_comment",
          description: "Delete a comment",
          inputSchema: {
            type: "object",
            properties: {
              commentId: { type: "string", description: "Comment ID" },
            },
            required: ["commentId"],
          },
        },
        {
          name: "vercel_resolve_comment",
          description: "Resolve or unresolve a comment",
          inputSchema: {
            type: "object",
            properties: {
              commentId: { type: "string", description: "Comment ID" },
              resolved: { type: "boolean", description: "Resolved status" },
            },
            required: ["commentId", "resolved"],
          },
        },

        // ==================== GIT INTEGRATION ====================
        {
          name: "vercel_list_git_repositories",
          description: "List connected Git repositories",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_connect_git_repository",
          description: "Connect a new Git repository",
          inputSchema: {
            type: "object",
            properties: {
              type: { type: "string", description: "Git provider: github, gitlab, bitbucket" },
              repo: { type: "string", description: "Repository path (owner/repo)" },
              projectId: { type: "string", description: "Project ID to connect to" },
            },
            required: ["type", "repo"],
          },
        },
        {
          name: "vercel_disconnect_git_repository",
          description: "Disconnect a Git repository",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_sync_git_repository",
          description: "Sync Git repository",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_git_integration_status",
          description: "Get Git integration status",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
            },
            required: ["projectId"],
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

          // Blob Storage
          case "vercel_blob_list":
            return await this.blobList(args);
          case "vercel_blob_put":
            return await this.blobPut(args);
          case "vercel_blob_delete":
            return await this.blobDelete(args);
          case "vercel_blob_head":
            return await this.blobHead(args);

          // KV Storage
          case "vercel_kv_get":
            return await this.kvGet(args);
          case "vercel_kv_set":
            return await this.kvSet(args);
          case "vercel_kv_delete":
            return await this.kvDelete(args);
          case "vercel_kv_list_keys":
            return await this.kvListKeys(args);

          // Postgres
          case "vercel_postgres_list_databases":
            return await this.postgresListDatabases(args);
          case "vercel_postgres_create_database":
            return await this.postgresCreateDatabase(args);
          case "vercel_postgres_delete_database":
            return await this.postgresDeleteDatabase(args);
          case "vercel_postgres_get_connection_string":
            return await this.postgresGetConnectionString(args);

          // Firewall & Security
          case "vercel_list_firewall_rules":
            return await this.listFirewallRules(args);
          case "vercel_create_firewall_rule":
            return await this.createFirewallRule(args);
          case "vercel_update_firewall_rule":
            return await this.updateFirewallRule(args);
          case "vercel_delete_firewall_rule":
            return await this.deleteFirewallRule(args);
          case "vercel_get_firewall_analytics":
            return await this.getFirewallAnalytics(args);
          case "vercel_list_blocked_ips":
            return await this.listBlockedIps(args);
          case "vercel_block_ip":
            return await this.blockIp(args);
          case "vercel_unblock_ip":
            return await this.unblockIp(args);
          case "vercel_enable_attack_challenge_mode":
            return await this.enableAttackChallengeMode(args);
          case "vercel_get_security_events":
            return await this.getSecurityEvents(args);

          // Monitoring & Observability
          case "vercel_get_runtime_logs_stream":
            return await this.getRuntimeLogsStream(args);
          case "vercel_get_build_logs":
            return await this.getBuildLogs(args);
          case "vercel_get_error_logs":
            return await this.getErrorLogs(args);
          case "vercel_get_bandwidth_usage":
            return await this.getBandwidthUsage(args);
          case "vercel_get_function_invocations":
            return await this.getFunctionInvocations(args);
          case "vercel_get_cache_metrics":
            return await this.getCacheMetrics(args);
          case "vercel_get_traces":
            return await this.getTraces(args);
          case "vercel_get_performance_insights":
            return await this.getPerformanceInsights(args);
          case "vercel_get_web_vitals":
            return await this.getWebVitals(args);

          // Billing & Usage
          case "vercel_get_billing_summary":
            return await this.getBillingSummary(args);
          case "vercel_get_usage_metrics":
            return await this.getUsageMetrics(args);
          case "vercel_get_invoice":
            return await this.getInvoice(args);
          case "vercel_list_invoices":
            return await this.listInvoices(args);
          case "vercel_get_spending_limits":
            return await this.getSpendingLimits(args);
          case "vercel_update_spending_limits":
            return await this.updateSpendingLimits(args);
          case "vercel_get_cost_breakdown":
            return await this.getCostBreakdown(args);
          case "vercel_export_usage_report":
            return await this.exportUsageReport(args);

          // Integrations & Marketplace
          case "vercel_list_integrations":
            return await this.listIntegrations(args);
          case "vercel_get_integration":
            return await this.getIntegration(args);
          case "vercel_install_integration":
            return await this.installIntegration(args);
          case "vercel_uninstall_integration":
            return await this.uninstallIntegration(args);
          case "vercel_list_integration_configurations":
            return await this.listIntegrationConfigurations(args);
          case "vercel_update_integration_configuration":
            return await this.updateIntegrationConfiguration(args);
          case "vercel_get_integration_logs":
            return await this.getIntegrationLogs(args);
          case "vercel_trigger_integration_sync":
            return await this.triggerIntegrationSync(args);

          // Audit Logs
          case "vercel_list_audit_logs":
            return await this.listAuditLogs(args);
          case "vercel_get_audit_log":
            return await this.getAuditLog(args);
          case "vercel_export_audit_logs":
            return await this.exportAuditLogs(args);
          case "vercel_get_compliance_report":
            return await this.getComplianceReport(args);
          case "vercel_list_access_events":
            return await this.listAccessEvents(args);

          // Cron Jobs
          case "vercel_list_cron_jobs":
            return await this.listCronJobs(args);
          case "vercel_create_cron_job":
            return await this.createCronJob(args);
          case "vercel_update_cron_job":
            return await this.updateCronJob(args);
          case "vercel_delete_cron_job":
            return await this.deleteCronJob(args);
          case "vercel_trigger_cron_job":
            return await this.triggerCronJob(args);

          // Advanced Routing
          case "vercel_list_redirects":
            return await this.listRedirects(args);
          case "vercel_create_redirect":
            return await this.createRedirect(args);
          case "vercel_delete_redirect":
            return await this.deleteRedirect(args);
          case "vercel_list_custom_headers":
            return await this.listCustomHeaders(args);
          case "vercel_create_custom_header":
            return await this.createCustomHeader(args);
          case "vercel_delete_custom_header":
            return await this.deleteCustomHeader(args);

          // Preview Comments
          case "vercel_list_comments":
            return await this.listComments(args);
          case "vercel_create_comment":
            return await this.createComment(args);
          case "vercel_update_comment":
            return await this.updateComment(args);
          case "vercel_delete_comment":
            return await this.deleteComment(args);
          case "vercel_resolve_comment":
            return await this.resolveComment(args);

          // Git Integration
          case "vercel_list_git_repositories":
            return await this.listGitRepositories(args);
          case "vercel_connect_git_repository":
            return await this.connectGitRepository(args);
          case "vercel_disconnect_git_repository":
            return await this.disconnectGitRepository(args);
          case "vercel_sync_git_repository":
            return await this.syncGitRepository(args);
          case "vercel_get_git_integration_status":
            return await this.getGitIntegrationStatus(args);

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

  // ==================== BLOB STORAGE METHODS ====================

  private async blobList(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit.toString());
    if (args.cursor) params.append("cursor", args.cursor);
    const data = await this.vercelFetch(`/v1/blob?${params}`);
    return this.formatResponse(data);
  }

  private async blobPut(args: any) {
    const data = await this.vercelFetch(`/v1/blob`, {
      method: "PUT",
      body: JSON.stringify({
        pathname: args.pathname,
        body: args.body,
        contentType: args.contentType,
      }),
    });
    return this.formatResponse(data);
  }

  private async blobDelete(args: any) {
    const data = await this.vercelFetch(`/v1/blob`, {
      method: "DELETE",
      body: JSON.stringify({ url: args.url }),
    });
    return this.formatResponse(data);
  }

  private async blobHead(args: any) {
    const data = await this.vercelFetch(`/v1/blob/head?url=${encodeURIComponent(args.url)}`);
    return this.formatResponse(data);
  }

  // ==================== KV STORAGE METHODS ====================

  private async kvGet(args: any) {
    const data = await this.vercelFetch(`/v1/kv/${args.storeId}/get/${args.key}`);
    return this.formatResponse(data);
  }

  private async kvSet(args: any) {
    const body: any = { key: args.key, value: args.value };
    if (args.ex) body.ex = args.ex;
    const data = await this.vercelFetch(`/v1/kv/${args.storeId}/set`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return this.formatResponse(data);
  }

  private async kvDelete(args: any) {
    const data = await this.vercelFetch(`/v1/kv/${args.storeId}/delete/${args.key}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async kvListKeys(args: any) {
    const params = new URLSearchParams();
    if (args.pattern) params.append("pattern", args.pattern);
    if (args.cursor) params.append("cursor", args.cursor);
    const data = await this.vercelFetch(`/v1/kv/${args.storeId}/keys?${params}`);
    return this.formatResponse(data);
  }

  // ==================== POSTGRES METHODS ====================

  private async postgresListDatabases(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/postgres?${params}`);
    return this.formatResponse(data);
  }

  private async postgresCreateDatabase(args: any) {
    const data = await this.vercelFetch(`/v1/postgres`, {
      method: "POST",
      body: JSON.stringify({
        name: args.name,
        region: args.region,
      }),
    });
    return this.formatResponse(data);
  }

  private async postgresDeleteDatabase(args: any) {
    const data = await this.vercelFetch(`/v1/postgres/${args.databaseId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async postgresGetConnectionString(args: any) {
    const data = await this.vercelFetch(`/v1/postgres/${args.databaseId}/connection-string`);
    return this.formatResponse(data);
  }

  // ==================== FIREWALL & SECURITY METHODS ====================

  private async listFirewallRules(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/rules?${params}`);
    return this.formatResponse(data);
  }

  private async createFirewallRule(args: any) {
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/rules`, {
      method: "POST",
      body: JSON.stringify({
        name: args.name,
        action: args.action,
        condition: args.condition,
      }),
    });
    return this.formatResponse(data);
  }

  private async updateFirewallRule(args: any) {
    const body: any = {};
    if (args.name) body.name = args.name;
    if (args.action) body.action = args.action;
    if (args.enabled !== undefined) body.enabled = args.enabled;
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/rules/${args.ruleId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return this.formatResponse(data);
  }

  private async deleteFirewallRule(args: any) {
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/rules/${args.ruleId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async getFirewallAnalytics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/analytics?${params}`);
    return this.formatResponse(data);
  }

  private async listBlockedIps(args: any) {
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/blocked-ips`);
    return this.formatResponse(data);
  }

  private async blockIp(args: any) {
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/blocked-ips`, {
      method: "POST",
      body: JSON.stringify({
        ipAddress: args.ipAddress,
        notes: args.notes,
      }),
    });
    return this.formatResponse(data);
  }

  private async unblockIp(args: any) {
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/blocked-ips/${encodeURIComponent(args.ipAddress)}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async enableAttackChallengeMode(args: any) {
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/challenge-mode`, {
      method: "PATCH",
      body: JSON.stringify({ enabled: args.enabled }),
    });
    return this.formatResponse(data);
  }

  private async getSecurityEvents(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await this.vercelFetch(`/v1/security/events/${args.projectId}?${params}`);
    return this.formatResponse(data);
  }

  // ==================== MONITORING & OBSERVABILITY METHODS ====================

  private async getRuntimeLogsStream(args: any) {
    const params = new URLSearchParams();
    if (args.follow) params.append("follow", "1");
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await this.vercelFetch(`/v2/deployments/${args.deploymentId}/events?${params}`);
    return this.formatResponse(data);
  }

  private async getBuildLogs(args: any) {
    const data = await this.vercelFetch(`/v1/deployments/${args.deploymentId}/builds`);
    return this.formatResponse(data);
  }

  private async getErrorLogs(args: any) {
    const params = new URLSearchParams();
    params.append("type", "error");
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await this.vercelFetch(`/v2/deployments/${args.deploymentId}/events?${params}`);
    return this.formatResponse(data);
  }

  private async getBandwidthUsage(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await this.vercelFetch(`/v1/analytics/${args.projectId}/bandwidth?${params}`);
    return this.formatResponse(data);
  }

  private async getFunctionInvocations(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await this.vercelFetch(`/v1/analytics/${args.projectId}/functions?${params}`);
    return this.formatResponse(data);
  }

  private async getCacheMetrics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await this.vercelFetch(`/v1/analytics/${args.projectId}/cache?${params}`);
    return this.formatResponse(data);
  }

  private async getTraces(args: any) {
    const params = new URLSearchParams();
    if (args.deploymentId) params.append("deploymentId", args.deploymentId);
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await this.vercelFetch(`/v1/traces/${args.projectId}?${params}`);
    return this.formatResponse(data);
  }

  private async getPerformanceInsights(args: any) {
    const data = await this.vercelFetch(`/v1/insights/${args.projectId}/performance`);
    return this.formatResponse(data);
  }

  private async getWebVitals(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await this.vercelFetch(`/v1/analytics/${args.projectId}/web-vitals?${params}`);
    return this.formatResponse(data);
  }

  // ==================== BILLING & USAGE METHODS ====================

  private async getBillingSummary(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/billing/summary?${params}`);
    return this.formatResponse(data);
  }

  private async getUsageMetrics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/billing/usage?${params}`);
    return this.formatResponse(data);
  }

  private async getInvoice(args: any) {
    const data = await this.vercelFetch(`/v1/billing/invoices/${args.invoiceId}`);
    return this.formatResponse(data);
  }

  private async listInvoices(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await this.vercelFetch(`/v1/billing/invoices?${params}`);
    return this.formatResponse(data);
  }

  private async getSpendingLimits(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/billing/limits?${params}`);
    return this.formatResponse(data);
  }

  private async updateSpendingLimits(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/billing/limits?${params}`, {
      method: "PATCH",
      body: JSON.stringify({ maxMonthlySpend: args.maxMonthlySpend }),
    });
    return this.formatResponse(data);
  }

  private async getCostBreakdown(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/billing/breakdown?${params}`);
    return this.formatResponse(data);
  }

  private async exportUsageReport(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    params.append("format", args.format);
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/billing/export?${params}`);
    return this.formatResponse(data);
  }

  // ==================== INTEGRATIONS & MARKETPLACE METHODS ====================

  private async listIntegrations(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/integrations?${params}`);
    return this.formatResponse(data);
  }

  private async getIntegration(args: any) {
    const data = await this.vercelFetch(`/v1/integrations/${args.integrationId}`);
    return this.formatResponse(data);
  }

  private async installIntegration(args: any) {
    const body: any = { integrationSlug: args.integrationSlug };
    if (args.teamId) body.teamId = args.teamId;
    if (args.configuration) body.configuration = args.configuration;
    const data = await this.vercelFetch(`/v1/integrations/install`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return this.formatResponse(data);
  }

  private async uninstallIntegration(args: any) {
    const data = await this.vercelFetch(`/v1/integrations/${args.integrationId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async listIntegrationConfigurations(args: any) {
    const data = await this.vercelFetch(`/v1/integrations/${args.integrationId}/configurations`);
    return this.formatResponse(data);
  }

  private async updateIntegrationConfiguration(args: any) {
    const data = await this.vercelFetch(`/v1/integrations/${args.integrationId}/configurations/${args.configurationId}`, {
      method: "PATCH",
      body: JSON.stringify(args.configuration),
    });
    return this.formatResponse(data);
  }

  private async getIntegrationLogs(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await this.vercelFetch(`/v1/integrations/${args.integrationId}/logs?${params}`);
    return this.formatResponse(data);
  }

  private async triggerIntegrationSync(args: any) {
    const data = await this.vercelFetch(`/v1/integrations/${args.integrationId}/sync`, {
      method: "POST",
    });
    return this.formatResponse(data);
  }

  // ==================== AUDIT LOGS METHODS ====================

  private async listAuditLogs(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await this.vercelFetch(`/v1/audit-logs?${params}`);
    return this.formatResponse(data);
  }

  private async getAuditLog(args: any) {
    const data = await this.vercelFetch(`/v1/audit-logs/${args.logId}`);
    return this.formatResponse(data);
  }

  private async exportAuditLogs(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    params.append("format", args.format);
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/audit-logs/export?${params}`);
    return this.formatResponse(data);
  }

  private async getComplianceReport(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/compliance/${args.reportType}?${params}`);
    return this.formatResponse(data);
  }

  private async listAccessEvents(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    if (args.userId) params.append("userId", args.userId);
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await this.vercelFetch(`/v1/access-events?${params}`);
    return this.formatResponse(data);
  }

  // ==================== CRON JOBS METHODS ====================

  private async listCronJobs(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/crons`);
    return this.formatResponse(data);
  }

  private async createCronJob(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/crons`, {
      method: "POST",
      body: JSON.stringify({
        path: args.path,
        schedule: args.schedule,
      }),
    });
    return this.formatResponse(data);
  }

  private async updateCronJob(args: any) {
    const body: any = {};
    if (args.schedule) body.schedule = args.schedule;
    if (args.enabled !== undefined) body.enabled = args.enabled;
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/crons/${args.cronId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return this.formatResponse(data);
  }

  private async deleteCronJob(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/crons/${args.cronId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async triggerCronJob(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/crons/${args.cronId}/trigger`, {
      method: "POST",
    });
    return this.formatResponse(data);
  }

  // ==================== ADVANCED ROUTING METHODS ====================

  private async listRedirects(args: any) {
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`);
    // Redirects are part of project configuration
    return this.formatResponse(data.redirects || []);
  }

  private async createRedirect(args: any) {
    // Get current project config
    const project = await this.vercelFetch(`/v9/projects/${args.projectId}`);
    const redirects = project.redirects || [];
    redirects.push({
      source: args.source,
      destination: args.destination,
      permanent: args.permanent || false,
    });
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ redirects }),
    });
    return this.formatResponse(data);
  }

  private async deleteRedirect(args: any) {
    // Get current project config
    const project = await this.vercelFetch(`/v9/projects/${args.projectId}`);
    const redirects = (project.redirects || []).filter((_: any, i: number) => i.toString() !== args.redirectId);
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ redirects }),
    });
    return this.formatResponse(data);
  }

  private async listCustomHeaders(args: any) {
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`);
    // Headers are part of project configuration
    return this.formatResponse(data.headers || []);
  }

  private async createCustomHeader(args: any) {
    // Get current project config
    const project = await this.vercelFetch(`/v9/projects/${args.projectId}`);
    const headers = project.headers || [];
    headers.push({
      source: args.source,
      headers: args.headers,
    });
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ headers }),
    });
    return this.formatResponse(data);
  }

  private async deleteCustomHeader(args: any) {
    // Get current project config
    const project = await this.vercelFetch(`/v9/projects/${args.projectId}`);
    const headers = (project.headers || []).filter((_: any, i: number) => i.toString() !== args.headerId);
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ headers }),
    });
    return this.formatResponse(data);
  }

  // ==================== PREVIEW COMMENTS METHODS ====================

  private async listComments(args: any) {
    const data = await this.vercelFetch(`/v1/deployments/${args.deploymentId}/comments`);
    return this.formatResponse(data);
  }

  private async createComment(args: any) {
    const body: any = { text: args.text };
    if (args.path) body.path = args.path;
    const data = await this.vercelFetch(`/v1/deployments/${args.deploymentId}/comments`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return this.formatResponse(data);
  }

  private async updateComment(args: any) {
    const data = await this.vercelFetch(`/v1/comments/${args.commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ text: args.text }),
    });
    return this.formatResponse(data);
  }

  private async deleteComment(args: any) {
    const data = await this.vercelFetch(`/v1/comments/${args.commentId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async resolveComment(args: any) {
    const data = await this.vercelFetch(`/v1/comments/${args.commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ resolved: args.resolved }),
    });
    return this.formatResponse(data);
  }

  // ==================== GIT INTEGRATION METHODS ====================

  private async listGitRepositories(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/git/repositories?${params}`);
    return this.formatResponse(data);
  }

  private async connectGitRepository(args: any) {
    const body: any = {
      type: args.type,
      repo: args.repo,
    };
    if (args.projectId) body.projectId = args.projectId;
    const data = await this.vercelFetch(`/v1/git/repositories`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return this.formatResponse(data);
  }

  private async disconnectGitRepository(args: any) {
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ link: null }),
    });
    return this.formatResponse(data);
  }

  private async syncGitRepository(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/git/sync`, {
      method: "POST",
    });
    return this.formatResponse(data);
  }

  private async getGitIntegrationStatus(args: any) {
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`);
    return this.formatResponse({
      connected: !!data.link,
      link: data.link,
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("@robinsonai/vercel-mcp server running on stdio");
  }
}

const server = new VercelMCP();
server.run().catch(console.error);
