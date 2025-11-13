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

  export async function vercelListProjects(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v9/projects?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetProject(args: any) {
    const data = await vercelFetch(`/v9/projects/${args.projectId}`);
    return formatResponse(data);
  }

  export async function vercelCreateProject(args: any) {
    const data = await vercelFetch(`/v9/projects`, {
      method: "POST",
      body: JSON.stringify(args),
    });
    return formatResponse(data);
  }

  export async function vercelUpdateProject(args: any) {
    const { projectId, ...updates } = args;
    const data = await vercelFetch(`/v9/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return formatResponse(data);
  }

  export async function vercelDeleteProject(args: any) {
    const data = await vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  // ==================== DEPLOYMENT METHODS ====================

  export async function vercelListDeployments(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit.toString());
    if (args.state) params.append("state", args.state);
    const data = await vercelFetch(
      `/v6/deployments?projectId=${args.projectId}&${params}`
    );
    return formatResponse(data);
  }

  export async function vercelGetDeployment(args: any) {
    const data = await vercelFetch(`/v13/deployments/${args.deploymentId}`);
    return formatResponse(data);
  }

  export async function vercelCreateDeployment(args: any) {
    const data = await vercelFetch(`/v13/deployments`, {
      method: "POST",
      body: JSON.stringify(args),
    });
    return formatResponse(data);
  }

  export async function vercelCancelDeployment(args: any) {
    const data = await vercelFetch(
      `/v12/deployments/${args.deploymentId}/cancel`,
      { method: "PATCH" }
    );
    return formatResponse(data);
  }

  export async function vercelDeleteDeployment(args: any) {
    const data = await vercelFetch(`/v13/deployments/${args.deploymentId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelGetDeploymentEvents(args: any) {
    const data = await vercelFetch(
      `/v3/deployments/${args.deploymentId}/events`
    );
    return formatResponse(data);
  }

  export async function vercelRedeploy(args: any) {
    const data = await vercelFetch(
      `/v13/deployments/${args.deploymentId}/redeploy`,
      {
        method: "POST",
        body: JSON.stringify({ target: args.target }),
      }
    );
    return formatResponse(data);
  }

  // ==================== ENV VAR METHODS ====================

  export async function vercelListEnvVars(args: any) {
    const data = await vercelFetch(`/v9/projects/${args.projectId}/env`);
    return formatResponse(data);
  }

  export async function vercelCreateEnvVar(args: any) {
    const { projectId, ...envVar } = args;
    const data = await vercelFetch(`/v10/projects/${projectId}/env`, {
      method: "POST",
      body: JSON.stringify(envVar),
    });
    return formatResponse(data);
  }

  export async function vercelUpdateEnvVar(args: any) {
    const { projectId, envId, ...updates } = args;
    const data = await vercelFetch(`/v9/projects/${projectId}/env/${envId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return formatResponse(data);
  }

  export async function vercelDeleteEnvVar(args: any) {
    const data = await vercelFetch(
      `/v9/projects/${args.projectId}/env/${args.envId}`,
      { method: "DELETE" }
    );
    return formatResponse(data);
  }

  export async function vercelBulkCreateEnvVars(args: any) {
    const { projectId, variables } = args;
    const results = [];
    for (const envVar of variables) {
      try {
        const data = await vercelFetch(`/v10/projects/${projectId}/env`, {
          method: "POST",
          body: JSON.stringify(envVar),
        });
        results.push({ success: true, key: envVar.key, data });
      } catch (error: any) {
        results.push({ success: false, key: envVar.key, error: error.message });
      }
    }
    return formatResponse({ results });
  }

  // ==================== DOMAIN METHODS ====================

  export async function vercelListDomains(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v5/domains?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetDomain(args: any) {
    const data = await vercelFetch(`/v5/domains/${args.domain}`);
    return formatResponse(data);
  }

  export async function vercelAddDomain(args: any) {
    const data = await vercelFetch(`/v10/projects/${args.projectId}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: args.domain }),
    });
    return formatResponse(data);
  }

  export async function vercelRemoveDomain(args: any) {
    const data = await vercelFetch(`/v9/domains/${args.domain}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelVerifyDomain(args: any) {
    const data = await vercelFetch(`/v6/domains/${args.domain}/verify`, {
      method: "POST",
    });
    return formatResponse(data);
  }

  // ==================== DNS METHODS ====================

  export async function vercelListDnsRecords(args: any) {
    const data = await vercelFetch(`/v4/domains/${args.domain}/records`);
    return formatResponse(data);
  }

  export async function vercelCreateDnsRecord(args: any) {
    const { domain, ...record } = args;
    const data = await vercelFetch(`/v2/domains/${domain}/records`, {
      method: "POST",
      body: JSON.stringify(record),
    });
    return formatResponse(data);
  }

  export async function vercelDeleteDnsRecord(args: any) {
    const data = await vercelFetch(
      `/v2/domains/${args.domain}/records/${args.recordId}`,
      { method: "DELETE" }
    );
    return formatResponse(data);
  }

  // ==================== TEAM METHODS ====================

  export async function vercelListTeams(args: any) {
    const data = await vercelFetch(`/v2/teams`);
    return formatResponse(data);
  }

  export async function vercelGetTeam(args: any) {
    const data = await vercelFetch(`/v2/teams/${args.teamId}`);
    return formatResponse(data);
  }

  export async function vercelListTeamMembers(args: any) {
    const data = await vercelFetch(`/v2/teams/${args.teamId}/members`);
    return formatResponse(data);
  }

  // ==================== LOGS & MONITORING METHODS ====================

  export async function vercelGetDeploymentLogs(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit.toString());
    if (args.since) params.append("since", args.since.toString());
    const data = await vercelFetch(
      `/v2/deployments/${args.deploymentId}/events?${params}`
    );
    return formatResponse(data);
  }

  export async function vercelGetProjectAnalytics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await vercelFetch(
      `/v1/projects/${args.projectId}/analytics?${params}`
    );
    return formatResponse(data);
  }

  // ==================== EDGE CONFIG METHODS ====================

  export async function vercelListEdgeConfigs(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/edge-config?${params}`);
    return formatResponse(data);
  }

  export async function vercelCreateEdgeConfig(args: any) {
    const data = await vercelFetch(`/v1/edge-config`, {
      method: "POST",
      body: JSON.stringify(args),
    });
    return formatResponse(data);
  }

  export async function vercelGetEdgeConfigItems(args: any) {
    const data = await vercelFetch(
      `/v1/edge-config/${args.edgeConfigId}/items`
    );
    return formatResponse(data);
  }

  export async function vercelUpdateEdgeConfigItems(args: any) {
    const { edgeConfigId, items } = args;
    const data = await vercelFetch(`/v1/edge-config/${edgeConfigId}/items`, {
      method: "PATCH",
      body: JSON.stringify({ items }),
    });
    return formatResponse(data);
  }

  // ==================== WEBHOOK METHODS ====================

  export async function vercelListWebhooks(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/webhooks`);
    return formatResponse(data);
  }

  export async function vercelCreateWebhook(args: any) {
    const { projectId, ...webhook } = args;
    const data = await vercelFetch(`/v1/projects/${projectId}/webhooks`, {
      method: "POST",
      body: JSON.stringify(webhook),
    });
    return formatResponse(data);
  }

  export async function vercelDeleteWebhook(args: any) {
    const data = await vercelFetch(`/v1/webhooks/${args.webhookId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  // ==================== ALIAS METHODS ====================

  export async function vercelListAliases(args: any) {
    const params = new URLSearchParams();
    if (args.projectId) params.append("projectId", args.projectId);
    if (args.limit) params.append("limit", args.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await vercelFetch(`/v4/aliases${query}`);
    return formatResponse(data);
  }

  export async function vercelAssignAlias(args: any) {
    const data = await vercelFetch(`/v2/deployments/${args.deploymentId}/aliases`, {
      method: "POST",
      body: JSON.stringify({ alias: args.alias }),
    });
    return formatResponse(data);
  }

  export async function vercelDeleteAlias(args: any) {
    const data = await vercelFetch(`/v2/aliases/${args.aliasId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  // ==================== SECRET METHODS ====================

  export async function vercelListSecrets(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await vercelFetch(`/v3/secrets${query}`);
    return formatResponse(data);
  }

  export async function vercelCreateSecret(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await vercelFetch(`/v3/secrets${query}`, {
      method: "POST",
      body: JSON.stringify({ name: args.name, value: args.value }),
    });
    return formatResponse(data);
  }

  export async function vercelDeleteSecret(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await vercelFetch(`/v2/secrets/${args.nameOrId}${query}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelRenameSecret(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await vercelFetch(`/v2/secrets/${args.nameOrId}${query}`, {
      method: "PATCH",
      body: JSON.stringify({ name: args.newName }),
    });
    return formatResponse(data);
  }

  // ==================== CHECK METHODS ====================

  export async function vercelListChecks(args: any) {
    const data = await vercelFetch(`/v1/deployments/${args.deploymentId}/checks`);
    return formatResponse(data);
  }

  export async function vercelCreateCheck(args: any) {
    const { deploymentId, ...check } = args;
    const data = await vercelFetch(`/v1/deployments/${deploymentId}/checks`, {
      method: "POST",
      body: JSON.stringify(check),
    });
    return formatResponse(data);
  }

  export async function vercelUpdateCheck(args: any) {
    const { deploymentId, checkId, ...update } = args;
    const data = await vercelFetch(`/v1/deployments/${deploymentId}/checks/${checkId}`, {
      method: "PATCH",
      body: JSON.stringify(update),
    });
    return formatResponse(data);
  }

  // ==================== DEPLOYMENT FILE METHODS ====================

  export async function vercelListDeploymentFiles(args: any) {
    const data = await vercelFetch(`/v6/deployments/${args.deploymentId}/files`);
    return formatResponse(data);
  }

  export async function vercelGetDeploymentFile(args: any) {
    const data = await vercelFetch(`/v6/deployments/${args.deploymentId}/files/${args.fileId}`);
    return formatResponse(data);
  }

  // ==================== BLOB STORAGE METHODS ====================

  export async function vercelBlobList(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit.toString());
    if (args.cursor) params.append("cursor", args.cursor);
    const data = await vercelFetch(`/v1/blob?${params}`);
    return formatResponse(data);
  }

  export async function vercelBlobPut(args: any) {
    const data = await vercelFetch(`/v1/blob`, {
      method: "PUT",
      body: JSON.stringify({
        pathname: args.pathname,
        body: args.body,
        contentType: args.contentType,
      }),
    });
    return formatResponse(data);
  }

  export async function vercelBlobDelete(args: any) {
    const data = await vercelFetch(`/v1/blob`, {
      method: "DELETE",
      body: JSON.stringify({ url: args.url }),
    });
    return formatResponse(data);
  }

  export async function vercelBlobHead(args: any) {
    const data = await vercelFetch(`/v1/blob/head?url=${encodeURIComponent(args.url)}`);
    return formatResponse(data);
  }

  // ==================== KV STORAGE METHODS ====================

  export async function vercelKvGet(args: any) {
    const data = await vercelFetch(`/v1/kv/${args.storeId}/get/${args.key}`);
    return formatResponse(data);
  }

  export async function vercelKvSet(args: any) {
    const body: any = { key: args.key, value: args.value };
    if (args.ex) body.ex = args.ex;
    const data = await vercelFetch(`/v1/kv/${args.storeId}/set`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return formatResponse(data);
  }

  export async function vercelKvDelete(args: any) {
    const data = await vercelFetch(`/v1/kv/${args.storeId}/delete/${args.key}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelKvListKeys(args: any) {
    const params = new URLSearchParams();
    if (args.pattern) params.append("pattern", args.pattern);
    if (args.cursor) params.append("cursor", args.cursor);
    const data = await vercelFetch(`/v1/kv/${args.storeId}/keys?${params}`);
    return formatResponse(data);
  }

  // ==================== POSTGRES METHODS ====================

  export async function vercelPostgresListDatabases(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/postgres?${params}`);
    return formatResponse(data);
  }

  export async function vercelPostgresCreateDatabase(args: any) {
    const data = await vercelFetch(`/v1/postgres`, {
      method: "POST",
      body: JSON.stringify({
        name: args.name,
        region: args.region,
      }),
    });
    return formatResponse(data);
  }

  export async function vercelPostgresDeleteDatabase(args: any) {
    const data = await vercelFetch(`/v1/postgres/${args.databaseId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelPostgresGetConnectionString(args: any) {
    const data = await vercelFetch(`/v1/postgres/${args.databaseId}/connection-string`);
    return formatResponse(data);
  }

  // ==================== FIREWALL & SECURITY METHODS ====================

  export async function vercelListFirewallRules(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/security/firewall/${args.projectId}/rules?${params}`);
    return formatResponse(data);
  }

  export async function vercelCreateFirewallRule(args: any) {
    const data = await vercelFetch(`/v1/security/firewall/${args.projectId}/rules`, {
      method: "POST",
      body: JSON.stringify({
        name: args.name,
        action: args.action,
        condition: args.condition,
      }),
    });
    return formatResponse(data);
  }

  export async function vercelUpdateFirewallRule(args: any) {
    const body: any = {};
    if (args.name) body.name = args.name;
    if (args.action) body.action = args.action;
    if (args.enabled !== undefined) body.enabled = args.enabled;
    const data = await vercelFetch(`/v1/security/firewall/${args.projectId}/rules/${args.ruleId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return formatResponse(data);
  }

  export async function vercelDeleteFirewallRule(args: any) {
    const data = await vercelFetch(`/v1/security/firewall/${args.projectId}/rules/${args.ruleId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelGetFirewallAnalytics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await vercelFetch(`/v1/security/firewall/${args.projectId}/analytics?${params}`);
    return formatResponse(data);
  }

  export async function vercelListBlockedIps(args: any) {
    const data = await vercelFetch(`/v1/security/firewall/${args.projectId}/blocked-ips`);
    return formatResponse(data);
  }

  export async function vercelBlockIp(args: any) {
    const data = await vercelFetch(`/v1/security/firewall/${args.projectId}/blocked-ips`, {
      method: "POST",
      body: JSON.stringify({
        ipAddress: args.ipAddress,
        notes: args.notes,
      }),
    });
    return formatResponse(data);
  }

  export async function vercelUnblockIp(args: any) {
    const data = await vercelFetch(`/v1/security/firewall/${args.projectId}/blocked-ips/${encodeURIComponent(args.ipAddress)}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelEnableAttackChallengeMode(args: any) {
    const data = await vercelFetch(`/v1/security/firewall/${args.projectId}/challenge-mode`, {
      method: "PATCH",
      body: JSON.stringify({ enabled: args.enabled }),
    });
    return formatResponse(data);
  }

  export async function vercelGetSecurityEvents(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await vercelFetch(`/v1/security/events/${args.projectId}?${params}`);
    return formatResponse(data);
  }

  // ==================== MONITORING & OBSERVABILITY METHODS ====================

  export async function vercelGetRuntimeLogsStream(args: any) {
    const params = new URLSearchParams();
    if (args.follow) params.append("follow", "1");
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await vercelFetch(`/v2/deployments/${args.deploymentId}/events?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetBuildLogs(args: any) {
    const data = await vercelFetch(`/v1/deployments/${args.deploymentId}/builds`);
    return formatResponse(data);
  }

  export async function vercelGetErrorLogs(args: any) {
    const params = new URLSearchParams();
    params.append("type", "error");
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await vercelFetch(`/v2/deployments/${args.deploymentId}/events?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetBandwidthUsage(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await vercelFetch(`/v1/analytics/${args.projectId}/bandwidth?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetFunctionInvocations(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await vercelFetch(`/v1/analytics/${args.projectId}/functions?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetCacheMetrics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await vercelFetch(`/v1/analytics/${args.projectId}/cache?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetTraces(args: any) {
    const params = new URLSearchParams();
    if (args.deploymentId) params.append("deploymentId", args.deploymentId);
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await vercelFetch(`/v1/traces/${args.projectId}?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetPerformanceInsights(args: any) {
    const data = await vercelFetch(`/v1/insights/${args.projectId}/performance`);
    return formatResponse(data);
  }

  export async function vercelGetWebVitals(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await vercelFetch(`/v1/analytics/${args.projectId}/web-vitals?${params}`);
    return formatResponse(data);
  }

  // ==================== BILLING & USAGE METHODS ====================

  export async function vercelGetBillingSummary(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/billing/summary?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetUsageMetrics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/billing/usage?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetInvoice(args: any) {
    const data = await vercelFetch(`/v1/billing/invoices/${args.invoiceId}`);
    return formatResponse(data);
  }

  export async function vercelListInvoices(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await vercelFetch(`/v1/billing/invoices?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetSpendingLimits(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/billing/limits?${params}`);
    return formatResponse(data);
  }

  export async function vercelUpdateSpendingLimits(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/billing/limits?${params}`, {
      method: "PATCH",
      body: JSON.stringify({ maxMonthlySpend: args.maxMonthlySpend }),
    });
    return formatResponse(data);
  }

  export async function vercelGetCostBreakdown(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/billing/breakdown?${params}`);
    return formatResponse(data);
  }

  export async function vercelExportUsageReport(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    params.append("format", args.format);
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/billing/export?${params}`);
    return formatResponse(data);
  }

  // ==================== INTEGRATIONS & MARKETPLACE METHODS ====================

  export async function vercelListIntegrations(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/integrations?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetIntegration(args: any) {
    const data = await vercelFetch(`/v1/integrations/${args.integrationId}`);
    return formatResponse(data);
  }

  export async function vercelInstallIntegration(args: any) {
    const body: any = { integrationSlug: args.integrationSlug };
    if (args.teamId) body.teamId = args.teamId;
    if (args.configuration) body.configuration = args.configuration;
    const data = await vercelFetch(`/v1/integrations/install`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return formatResponse(data);
  }

  export async function vercelUninstallIntegration(args: any) {
    const data = await vercelFetch(`/v1/integrations/${args.integrationId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelListIntegrationConfigurations(args: any) {
    const data = await vercelFetch(`/v1/integrations/${args.integrationId}/configurations`);
    return formatResponse(data);
  }

  export async function vercelUpdateIntegrationConfiguration(args: any) {
    const data = await vercelFetch(`/v1/integrations/${args.integrationId}/configurations/${args.configurationId}`, {
      method: "PATCH",
      body: JSON.stringify(args.configuration),
    });
    return formatResponse(data);
  }

  export async function vercelGetIntegrationLogs(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await vercelFetch(`/v1/integrations/${args.integrationId}/logs?${params}`);
    return formatResponse(data);
  }

  export async function vercelTriggerIntegrationSync(args: any) {
    const data = await vercelFetch(`/v1/integrations/${args.integrationId}/sync`, {
      method: "POST",
    });
    return formatResponse(data);
  }

  // ==================== AUDIT LOGS METHODS ====================

  export async function vercelListAuditLogs(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await vercelFetch(`/v1/audit-logs?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetAuditLog(args: any) {
    const data = await vercelFetch(`/v1/audit-logs/${args.logId}`);
    return formatResponse(data);
  }

  export async function vercelExportAuditLogs(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    params.append("format", args.format);
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/audit-logs/export?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetComplianceReport(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/compliance/${args.reportType}?${params}`);
    return formatResponse(data);
  }

  export async function vercelListAccessEvents(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    if (args.userId) params.append("userId", args.userId);
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await vercelFetch(`/v1/access-events?${params}`);
    return formatResponse(data);
  }

  // ==================== CRON JOBS METHODS ====================

  export async function vercelListCronJobs(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/crons`);
    return formatResponse(data);
  }

  export async function vercelCreateCronJob(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/crons`, {
      method: "POST",
      body: JSON.stringify({
        path: args.path,
        schedule: args.schedule,
      }),
    });
    return formatResponse(data);
  }

  export async function vercelUpdateCronJob(args: any) {
    const body: any = {};
    if (args.schedule) body.schedule = args.schedule;
    if (args.enabled !== undefined) body.enabled = args.enabled;
    const data = await vercelFetch(`/v1/projects/${args.projectId}/crons/${args.cronId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return formatResponse(data);
  }

  export async function vercelDeleteCronJob(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/crons/${args.cronId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelTriggerCronJob(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/crons/${args.cronId}/trigger`, {
      method: "POST",
    });
    return formatResponse(data);
  }

  // ==================== ADVANCED ROUTING METHODS ====================

  export async function vercelListRedirects(args: any) {
    const data = await vercelFetch(`/v9/projects/${args.projectId}`);
    // Redirects are part of project configuration
    return formatResponse(data.redirects || []);
  }

  export async function vercelCreateRedirect(args: any) {
    // Get current project config
    const project = await vercelFetch(`/v9/projects/${args.projectId}`);
    const redirects = project.redirects || [];
    redirects.push({
      source: args.source,
      destination: args.destination,
      permanent: args.permanent || false,
    });
    const data = await vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ redirects }),
    });
    return formatResponse(data);
  }

  export async function vercelDeleteRedirect(args: any) {
    // Get current project config
    const project = await vercelFetch(`/v9/projects/${args.projectId}`);
    const redirects = (project.redirects || []).filter((_: any, i: number) => i.toString() !== args.redirectId);
    const data = await vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ redirects }),
    });
    return formatResponse(data);
  }

  export async function vercelListCustomHeaders(args: any) {
    const data = await vercelFetch(`/v9/projects/${args.projectId}`);
    // Headers are part of project configuration
    return formatResponse(data.headers || []);
  }

  export async function vercelCreateCustomHeader(args: any) {
    // Get current project config
    const project = await vercelFetch(`/v9/projects/${args.projectId}`);
    const headers = project.headers || [];
    headers.push({
      source: args.source,
      headers: args.headers,
    });
    const data = await vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ headers }),
    });
    return formatResponse(data);
  }

  export async function vercelDeleteCustomHeader(args: any) {
    // Get current project config
    const project = await vercelFetch(`/v9/projects/${args.projectId}`);
    const headers = (project.headers || []).filter((_: any, i: number) => i.toString() !== args.headerId);
    const data = await vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ headers }),
    });
    return formatResponse(data);
  }

  // ==================== PREVIEW COMMENTS METHODS ====================

  export async function vercelListComments(args: any) {
    const data = await vercelFetch(`/v1/deployments/${args.deploymentId}/comments`);
    return formatResponse(data);
  }

  export async function vercelCreateComment(args: any) {
    const body: any = { text: args.text };
    if (args.path) body.path = args.path;
    const data = await vercelFetch(`/v1/deployments/${args.deploymentId}/comments`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return formatResponse(data);
  }

  export async function vercelUpdateComment(args: any) {
    const data = await vercelFetch(`/v1/comments/${args.commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ text: args.text }),
    });
    return formatResponse(data);
  }

  export async function vercelDeleteComment(args: any) {
    const data = await vercelFetch(`/v1/comments/${args.commentId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelResolveComment(args: any) {
    const data = await vercelFetch(`/v1/comments/${args.commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ resolved: args.resolved }),
    });
    return formatResponse(data);
  }

  // ==================== GIT INTEGRATION METHODS ====================

  export async function vercelListGitRepositories(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/git/repositories?${params}`);
    return formatResponse(data);
  }

  export async function vercelConnectGitRepository(args: any) {
    const body: any = {
      type: args.type,
      repo: args.repo,
    };
    if (args.projectId) body.projectId = args.projectId;
    const data = await vercelFetch(`/v1/git/repositories`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return formatResponse(data);
  }

  export async function vercelDisconnectGitRepository(args: any) {
    const data = await vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ link: null }),
    });
    return formatResponse(data);
  }

  export async function vercelSyncGitRepository(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/git/sync`, {
      method: "POST",
    });
    return formatResponse(data);
  }

  export async function vercelGetGitIntegrationStatus(args: any) {
    const data = await vercelFetch(`/v9/projects/${args.projectId}`);
    return formatResponse({
      connected: !!data.link,
      link: data.link,
    });
  }

  // EDGE MIDDLEWARE
  export async function vercelListMiddleware(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/middleware`);
    return formatResponse(data);
  }

  export async function vercelGetMiddlewareLogs(args: any) {
    const params = new URLSearchParams();
    if (args.deploymentId) params.append('deploymentId', args.deploymentId);
    if (args.limit) params.append('limit', args.limit.toString());
    const data = await vercelFetch(`/v1/projects/${args.projectId}/middleware/logs?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetMiddlewareMetrics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await vercelFetch(`/v1/projects/${args.projectId}/middleware/metrics?${params}`);
    return formatResponse(data);
  }

  export async function vercelTestMiddleware(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/middleware/test`, {
      method: 'POST',
      body: JSON.stringify({ code: args.code, testRequest: args.testRequest })
    });
    return formatResponse(data);
  }

  export async function vercelDeployMiddleware(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/middleware`, {
      method: 'POST',
      body: JSON.stringify({ code: args.code, config: args.config })
    });
    return formatResponse(data);
  }

  // MONITORING & OBSERVABILITY
  export async function vercelGetDeploymentHealth(args: any) {
    const data = await vercelFetch(`/v1/deployments/${args.deploymentId}/health`);
    return formatResponse(data);
  }

  export async function vercelGetErrorRate(args: any) {
    const params = new URLSearchParams();
    if (args.deploymentId) params.append('deploymentId', args.deploymentId);
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await vercelFetch(`/v1/projects/${args.projectId}/metrics/errors?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetResponseTime(args: any) {
    const params = new URLSearchParams();
    if (args.deploymentId) params.append('deploymentId', args.deploymentId);
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await vercelFetch(`/v1/projects/${args.projectId}/metrics/response-time?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetUptimeMetrics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await vercelFetch(`/v1/projects/${args.projectId}/metrics/uptime?${params}`);
    return formatResponse(data);
  }

  export async function vercelCreateAlert(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/alerts`, {
      method: 'POST',
      body: JSON.stringify({
        name: args.name,
        metric: args.metric,
        threshold: args.threshold,
        webhookUrl: args.webhookUrl
      })
    });
    return formatResponse(data);
  }

  // TEAM MANAGEMENT
  export async function vercelInviteTeamMember(args: any) {
    const data = await vercelFetch(`/v1/teams/${args.teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email: args.email, role: args.role || 'MEMBER' })
    });
    return formatResponse(data);
  }

  export async function vercelRemoveTeamMember(args: any) {
    const data = await vercelFetch(`/v1/teams/${args.teamId}/members/${args.userId}`, {
      method: 'DELETE'
    });
    return formatResponse(data);
  }

  export async function vercelUpdateTeamMemberRole(args: any) {
    const data = await vercelFetch(`/v1/teams/${args.teamId}/members/${args.userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: args.role })
    });
    return formatResponse(data);
  }

  export async function vercelGetTeamActivity(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await vercelFetch(`/v1/teams/${args.teamId}/activity?${params}`);
    return formatResponse(data);
  }

  export async function vercelGetTeamUsage(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await vercelFetch(`/v1/teams/${args.teamId}/usage?${params}`);
    return formatResponse(data);
  }

  // ADVANCED DEPLOYMENT
  export async function vercelPromoteDeployment(args: any) {
    const data = await vercelFetch(`/v13/deployments/${args.deploymentId}/promote`, {
      method: 'POST'
    });
    return formatResponse(data);
  }

  export async function vercelRollbackDeployment(args: any) {
    const data = await vercelFetch(`/v13/deployments/${args.projectId}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ targetDeploymentId: args.targetDeploymentId })
    });
    return formatResponse(data);
  }

  export async function vercelPauseDeployment(args: any) {
    const data = await vercelFetch(`/v1/deployments/${args.deploymentId}/pause`, {
      method: 'POST'
    });
    return formatResponse(data);
  }

  export async function vercelResumeDeployment(args: any) {
    const data = await vercelFetch(`/v1/deployments/${args.deploymentId}/resume`, {
      method: 'POST'
    });
    return formatResponse(data);
  }

  export async function vercelGetDeploymentDiff(args: any) {
    const data = await vercelFetch(`/v1/deployments/diff?deployment1=${args.deploymentId1}&deployment2=${args.deploymentId2}`);
    return formatResponse(data);
  }

  // STORAGE MANAGEMENT
  export async function vercelGetStorageUsage(args: any) {
    const params = args.teamId ? `?teamId=${args.teamId}` : '';
    const data = await vercelFetch(`/v1/storage/usage${params}`);
    return formatResponse(data);
  }

  export async function vercelOptimizeStorage(args: any) {
    const params = args.teamId ? `?teamId=${args.teamId}` : '';
    const data = await vercelFetch(`/v1/storage/optimize${params}`);
    return formatResponse(data);
  }

  export async function vercelExportBlobData(args: any) {
    const data = await vercelFetch(`/v1/blob/${args.storeId}/export?format=${args.format || 'json'}`);
    return formatResponse(data);
  }

  export async function vercelImportBlobData(args: any) {
    const data = await vercelFetch(`/v1/blob/${args.storeId}/import`, {
      method: 'POST',
      body: JSON.stringify({ data: args.data, format: args.format || 'json' })
    });
    return formatResponse(data);
  }

  export async function vercelCloneStorage(args: any) {
    const data = await vercelFetch(`/v1/storage/clone`, {
      method: 'POST',
      body: JSON.stringify({
        sourceStoreId: args.sourceStoreId,
        targetStoreId: args.targetStoreId
      })
    });
    return formatResponse(data);
  }

  // ADVANCED SECURITY
  export async function vercelScanDeploymentSecurity(args: any) {
    const data = await vercelFetch(`/v1/deployments/${args.deploymentId}/security-scan`, {
      method: 'POST'
    });
    return formatResponse(data);
  }

  export async function vercelGetSecurityHeaders(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/security-headers`);
    return formatResponse(data);
  }

  export async function vercelUpdateSecurityHeaders(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/security-headers`, {
      method: 'PATCH',
      body: JSON.stringify({ headers: args.headers })
    });
    return formatResponse(data);
  }


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
