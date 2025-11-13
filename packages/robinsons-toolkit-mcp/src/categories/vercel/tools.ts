/**
 * Vercel Tool Definitions
 * Extracted from temp-vercel-mcp.ts
 */

export const VERCEL_TOOLS = [
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
  {
          name: "vercel_list_middleware",
          description: "List Edge Middleware functions",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              deploymentId: { type: "string" },
            },
            required: ["projectId"],
          },
        },
  {
          name: "vercel_get_middleware_logs",
          description: "Get Edge Middleware execution logs",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              deploymentId: { type: "string" },
              limit: { type: "number" },
            },
            required: ["projectId"],
          },
        },
  {
          name: "vercel_get_middleware_metrics",
          description: "Get Edge Middleware performance metrics",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              from: { type: "string" },
              to: { type: "string" },
            },
            required: ["projectId"],
          },
        },
  {
          name: "vercel_test_middleware",
          description: "Test Edge Middleware locally",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              code: { type: "string" },
              testRequest: { type: "object" },
            },
            required: ["projectId", "code"],
          },
        },
  {
          name: "vercel_deploy_middleware",
          description: "Deploy Edge Middleware",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              code: { type: "string" },
              config: { type: "object" },
            },
            required: ["projectId", "code"],
          },
        },
  {
          name: "vercel_get_deployment_health",
          description: "Get deployment health status",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string" },
            },
            required: ["deploymentId"],
          },
        },
  {
          name: "vercel_get_error_rate",
          description: "Get error rate metrics",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              deploymentId: { type: "string" },
              from: { type: "string" },
              to: { type: "string" },
            },
            required: ["projectId"],
          },
        },
  {
          name: "vercel_get_response_time",
          description: "Get response time metrics",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              deploymentId: { type: "string" },
              from: { type: "string" },
              to: { type: "string" },
            },
            required: ["projectId"],
          },
        },
  {
          name: "vercel_get_uptime_metrics",
          description: "Get uptime and availability metrics",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              from: { type: "string" },
              to: { type: "string" },
            },
            required: ["projectId"],
          },
        },
  {
          name: "vercel_create_alert",
          description: "Create monitoring alert",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              name: { type: "string" },
              metric: { type: "string" },
              threshold: { type: "number" },
              webhookUrl: { type: "string" },
            },
            required: ["projectId", "name", "metric", "threshold"],
          },
        },
  {
          name: "vercel_invite_team_member",
          description: "Invite user to team",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string" },
              email: { type: "string" },
              role: { type: "string", enum: ["OWNER", "MEMBER", "VIEWER"] },
            },
            required: ["teamId", "email"],
          },
        },
  {
          name: "vercel_remove_team_member",
          description: "Remove user from team",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string" },
              userId: { type: "string" },
            },
            required: ["teamId", "userId"],
          },
        },
  {
          name: "vercel_update_team_member_role",
          description: "Update team member role",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string" },
              userId: { type: "string" },
              role: { type: "string", enum: ["OWNER", "MEMBER", "VIEWER"] },
            },
            required: ["teamId", "userId", "role"],
          },
        },
  {
          name: "vercel_get_team_activity",
          description: "Get team activity log",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string" },
              limit: { type: "number" },
              from: { type: "string" },
              to: { type: "string" },
            },
            required: ["teamId"],
          },
        },
  {
          name: "vercel_get_team_usage",
          description: "Get team resource usage",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string" },
              from: { type: "string" },
              to: { type: "string" },
            },
            required: ["teamId"],
          },
        },
  {
          name: "vercel_promote_deployment",
          description: "Promote deployment to production",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string" },
            },
            required: ["deploymentId"],
          },
        },
  {
          name: "vercel_rollback_deployment",
          description: "Rollback to previous deployment",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              targetDeploymentId: { type: "string" },
            },
            required: ["projectId"],
          },
        },
  {
          name: "vercel_pause_deployment",
          description: "Pause deployment traffic",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string" },
            },
            required: ["deploymentId"],
          },
        },
  {
          name: "vercel_resume_deployment",
          description: "Resume deployment traffic",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string" },
            },
            required: ["deploymentId"],
          },
        },
  {
          name: "vercel_get_deployment_diff",
          description: "Compare two deployments",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId1: { type: "string" },
              deploymentId2: { type: "string" },
            },
            required: ["deploymentId1", "deploymentId2"],
          },
        },
  {
          name: "vercel_get_storage_usage",
          description: "Get storage usage across all stores",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string" },
            },
          },
        },
  {
          name: "vercel_optimize_storage",
          description: "Get storage optimization recommendations",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string" },
            },
          },
        },
  {
          name: "vercel_export_blob_data",
          description: "Export blob storage data",
          inputSchema: {
            type: "object",
            properties: {
              storeId: { type: "string" },
              format: { type: "string", enum: ["json", "csv"] },
            },
            required: ["storeId"],
          },
        },
  {
          name: "vercel_import_blob_data",
          description: "Import data to blob storage",
          inputSchema: {
            type: "object",
            properties: {
              storeId: { type: "string" },
              data: { type: "string" },
              format: { type: "string", enum: ["json", "csv"] },
            },
            required: ["storeId", "data"],
          },
        },
  {
          name: "vercel_clone_storage",
          description: "Clone storage to another environment",
          inputSchema: {
            type: "object",
            properties: {
              sourceStoreId: { type: "string" },
              targetStoreId: { type: "string" },
            },
            required: ["sourceStoreId", "targetStoreId"],
          },
        },
  {
          name: "vercel_scan_deployment_security",
          description: "Run security scan on deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string" },
            },
            required: ["deploymentId"],
          },
        },
  {
          name: "vercel_get_security_headers",
          description: "Get security headers configuration",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
            },
            required: ["projectId"],
          },
        },
  {
          name: "vercel_update_security_headers",
          description: "Update security headers",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              headers: { type: "object" },
            },
            required: ["projectId", "headers"],
          },
        },
];
