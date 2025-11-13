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

  export async function vercellistProjects(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v9/projects?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetProject(args: any) {
    const data = await vercelFetch(`/v9/projects/${args.projectId}`);
    return formatResponse(data);
  }

  export async function vercelcreateProject(args: any) {
    const data = await vercelFetch(`/v9/projects`, {
      method: "POST",
      body: JSON.stringify(args),
    });
    return formatResponse(data);
  }

  export async function vercelupdateProject(args: any) {
    const { projectId, ...updates } = args;
    const data = await vercelFetch(`/v9/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return formatResponse(data);
  }

  export async function verceldeleteProject(args: any) {
    const data = await vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  // ==================== DEPLOYMENT METHODS ====================

  export async function vercellistDeployments(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit.toString());
    if (args.state) params.append("state", args.state);
    const data = await vercelFetch(
      `/v6/deployments?projectId=${args.projectId}&${params}`
    );
    return formatResponse(data);
  }

  export async function vercelgetDeployment(args: any) {
    const data = await vercelFetch(`/v13/deployments/${args.deploymentId}`);
    return formatResponse(data);
  }

  export async function vercelcreateDeployment(args: any) {
    const data = await vercelFetch(`/v13/deployments`, {
      method: "POST",
      body: JSON.stringify(args),
    });
    return formatResponse(data);
  }

  export async function vercelcancelDeployment(args: any) {
    const data = await vercelFetch(
      `/v12/deployments/${args.deploymentId}/cancel`,
      { method: "PATCH" }
    );
    return formatResponse(data);
  }

  export async function verceldeleteDeployment(args: any) {
    const data = await vercelFetch(`/v13/deployments/${args.deploymentId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelgetDeploymentEvents(args: any) {
    const data = await vercelFetch(
      `/v3/deployments/${args.deploymentId}/events`
    );
    return formatResponse(data);
  }

  export async function vercelredeploy(args: any) {
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

  export async function vercellistEnvVars(args: any) {
    const data = await vercelFetch(`/v9/projects/${args.projectId}/env`);
    return formatResponse(data);
  }

  export async function vercelcreateEnvVar(args: any) {
    const { projectId, ...envVar } = args;
    const data = await vercelFetch(`/v10/projects/${projectId}/env`, {
      method: "POST",
      body: JSON.stringify(envVar),
    });
    return formatResponse(data);
  }

  export async function vercelupdateEnvVar(args: any) {
    const { projectId, envId, ...updates } = args;
    const data = await vercelFetch(`/v9/projects/${projectId}/env/${envId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return formatResponse(data);
  }

  export async function verceldeleteEnvVar(args: any) {
    const data = await vercelFetch(
      `/v9/projects/${args.projectId}/env/${args.envId}`,
      { method: "DELETE" }
    );
    return formatResponse(data);
  }

  export async function vercelbulkCreateEnvVars(args: any) {
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

  export async function vercellistDomains(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v5/domains?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetDomain(args: any) {
    const data = await vercelFetch(`/v5/domains/${args.domain}`);
    return formatResponse(data);
  }

  export async function verceladdDomain(args: any) {
    const data = await vercelFetch(`/v10/projects/${args.projectId}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: args.domain }),
    });
    return formatResponse(data);
  }

  export async function vercelremoveDomain(args: any) {
    const data = await vercelFetch(`/v9/domains/${args.domain}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelverifyDomain(args: any) {
    const data = await vercelFetch(`/v6/domains/${args.domain}/verify`, {
      method: "POST",
    });
    return formatResponse(data);
  }

  // ==================== DNS METHODS ====================

  export async function vercellistDnsRecords(args: any) {
    const data = await vercelFetch(`/v4/domains/${args.domain}/records`);
    return formatResponse(data);
  }

  export async function vercelcreateDnsRecord(args: any) {
    const { domain, ...record } = args;
    const data = await vercelFetch(`/v2/domains/${domain}/records`, {
      method: "POST",
      body: JSON.stringify(record),
    });
    return formatResponse(data);
  }

  export async function verceldeleteDnsRecord(args: any) {
    const data = await vercelFetch(
      `/v2/domains/${args.domain}/records/${args.recordId}`,
      { method: "DELETE" }
    );
    return formatResponse(data);
  }

  // ==================== TEAM METHODS ====================

  export async function vercellistTeams(args: any) {
    const data = await vercelFetch(`/v2/teams`);
    return formatResponse(data);
  }

  export async function vercelgetTeam(args: any) {
    const data = await vercelFetch(`/v2/teams/${args.teamId}`);
    return formatResponse(data);
  }

  export async function vercellistTeamMembers(args: any) {
    const data = await vercelFetch(`/v2/teams/${args.teamId}/members`);
    return formatResponse(data);
  }

  // ==================== LOGS & MONITORING METHODS ====================

  export async function vercelgetDeploymentLogs(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit.toString());
    if (args.since) params.append("since", args.since.toString());
    const data = await vercelFetch(
      `/v2/deployments/${args.deploymentId}/events?${params}`
    );
    return formatResponse(data);
  }

  export async function vercelgetProjectAnalytics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await vercelFetch(
      `/v1/projects/${args.projectId}/analytics?${params}`
    );
    return formatResponse(data);
  }

  // ==================== EDGE CONFIG METHODS ====================

  export async function vercellistEdgeConfigs(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/edge-config?${params}`);
    return formatResponse(data);
  }

  export async function vercelcreateEdgeConfig(args: any) {
    const data = await vercelFetch(`/v1/edge-config`, {
      method: "POST",
      body: JSON.stringify(args),
    });
    return formatResponse(data);
  }

  export async function vercelgetEdgeConfigItems(args: any) {
    const data = await vercelFetch(
      `/v1/edge-config/${args.edgeConfigId}/items`
    );
    return formatResponse(data);
  }

  export async function vercelupdateEdgeConfigItems(args: any) {
    const { edgeConfigId, items } = args;
    const data = await vercelFetch(`/v1/edge-config/${edgeConfigId}/items`, {
      method: "PATCH",
      body: JSON.stringify({ items }),
    });
    return formatResponse(data);
  }

  // ==================== WEBHOOK METHODS ====================

  export async function vercellistWebhooks(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/webhooks`);
    return formatResponse(data);
  }

  export async function vercelcreateWebhook(args: any) {
    const { projectId, ...webhook } = args;
    const data = await vercelFetch(`/v1/projects/${projectId}/webhooks`, {
      method: "POST",
      body: JSON.stringify(webhook),
    });
    return formatResponse(data);
  }

  export async function verceldeleteWebhook(args: any) {
    const data = await vercelFetch(`/v1/webhooks/${args.webhookId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  // ==================== ALIAS METHODS ====================

  export async function vercellistAliases(args: any) {
    const params = new URLSearchParams();
    if (args.projectId) params.append("projectId", args.projectId);
    if (args.limit) params.append("limit", args.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await vercelFetch(`/v4/aliases${query}`);
    return formatResponse(data);
  }

  export async function vercelassignAlias(args: any) {
    const data = await vercelFetch(`/v2/deployments/${args.deploymentId}/aliases`, {
      method: "POST",
      body: JSON.stringify({ alias: args.alias }),
    });
    return formatResponse(data);
  }

  export async function verceldeleteAlias(args: any) {
    const data = await vercelFetch(`/v2/aliases/${args.aliasId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  // ==================== SECRET METHODS ====================

  export async function vercellistSecrets(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await vercelFetch(`/v3/secrets${query}`);
    return formatResponse(data);
  }

  export async function vercelcreateSecret(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await vercelFetch(`/v3/secrets${query}`, {
      method: "POST",
      body: JSON.stringify({ name: args.name, value: args.value }),
    });
    return formatResponse(data);
  }

  export async function verceldeleteSecret(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await vercelFetch(`/v2/secrets/${args.nameOrId}${query}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelrenameSecret(args: any) {
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

  export async function vercellistChecks(args: any) {
    const data = await vercelFetch(`/v1/deployments/${args.deploymentId}/checks`);
    return formatResponse(data);
  }

  export async function vercelcreateCheck(args: any) {
    const { deploymentId, ...check } = args;
    const data = await vercelFetch(`/v1/deployments/${deploymentId}/checks`, {
      method: "POST",
      body: JSON.stringify(check),
    });
    return formatResponse(data);
  }

  export async function vercelupdateCheck(args: any) {
    const { deploymentId, checkId, ...update } = args;
    const data = await vercelFetch(`/v1/deployments/${deploymentId}/checks/${checkId}`, {
      method: "PATCH",
      body: JSON.stringify(update),
    });
    return formatResponse(data);
  }

  // ==================== DEPLOYMENT FILE METHODS ====================

  export async function vercellistDeploymentFiles(args: any) {
    const data = await vercelFetch(`/v6/deployments/${args.deploymentId}/files`);
    return formatResponse(data);
  }

  export async function vercelgetDeploymentFile(args: any) {
    const data = await vercelFetch(`/v6/deployments/${args.deploymentId}/files/${args.fileId}`);
    return formatResponse(data);
  }

  // ==================== BLOB STORAGE METHODS ====================

  export async function vercelblobList(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit.toString());
    if (args.cursor) params.append("cursor", args.cursor);
    const data = await vercelFetch(`/v1/blob?${params}`);
    return formatResponse(data);
  }

  export async function vercelblobPut(args: any) {
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

  export async function vercelblobDelete(args: any) {
    const data = await vercelFetch(`/v1/blob`, {
      method: "DELETE",
      body: JSON.stringify({ url: args.url }),
    });
    return formatResponse(data);
  }

  export async function vercelblobHead(args: any) {
    const data = await vercelFetch(`/v1/blob/head?url=${encodeURIComponent(args.url)}`);
    return formatResponse(data);
  }

  // ==================== KV STORAGE METHODS ====================

  export async function vercelkvGet(args: any) {
    const data = await vercelFetch(`/v1/kv/${args.storeId}/get/${args.key}`);
    return formatResponse(data);
  }

  export async function vercelkvSet(args: any) {
    const body: any = { key: args.key, value: args.value };
    if (args.ex) body.ex = args.ex;
    const data = await vercelFetch(`/v1/kv/${args.storeId}/set`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return formatResponse(data);
  }

  export async function vercelkvDelete(args: any) {
    const data = await vercelFetch(`/v1/kv/${args.storeId}/delete/${args.key}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelkvListKeys(args: any) {
    const params = new URLSearchParams();
    if (args.pattern) params.append("pattern", args.pattern);
    if (args.cursor) params.append("cursor", args.cursor);
    const data = await vercelFetch(`/v1/kv/${args.storeId}/keys?${params}`);
    return formatResponse(data);
  }

  // ==================== POSTGRES METHODS ====================

  export async function vercelpostgresListDatabases(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/postgres?${params}`);
    return formatResponse(data);
  }

  export async function vercelpostgresCreateDatabase(args: any) {
    const data = await vercelFetch(`/v1/postgres`, {
      method: "POST",
      body: JSON.stringify({
        name: args.name,
        region: args.region,
      }),
    });
    return formatResponse(data);
  }

  export async function vercelpostgresDeleteDatabase(args: any) {
    const data = await vercelFetch(`/v1/postgres/${args.databaseId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelpostgresGetConnectionString(args: any) {
    const data = await vercelFetch(`/v1/postgres/${args.databaseId}/connection-string`);
    return formatResponse(data);
  }

  // ==================== FIREWALL & SECURITY METHODS ====================

  export async function vercellistFirewallRules(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/security/firewall/${args.projectId}/rules?${params}`);
    return formatResponse(data);
  }

  export async function vercelcreateFirewallRule(args: any) {
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

  export async function vercelupdateFirewallRule(args: any) {
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

  export async function verceldeleteFirewallRule(args: any) {
    const data = await vercelFetch(`/v1/security/firewall/${args.projectId}/rules/${args.ruleId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelgetFirewallAnalytics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await vercelFetch(`/v1/security/firewall/${args.projectId}/analytics?${params}`);
    return formatResponse(data);
  }

  export async function vercellistBlockedIps(args: any) {
    const data = await vercelFetch(`/v1/security/firewall/${args.projectId}/blocked-ips`);
    return formatResponse(data);
  }

  export async function vercelblockIp(args: any) {
    const data = await vercelFetch(`/v1/security/firewall/${args.projectId}/blocked-ips`, {
      method: "POST",
      body: JSON.stringify({
        ipAddress: args.ipAddress,
        notes: args.notes,
      }),
    });
    return formatResponse(data);
  }

  export async function vercelunblockIp(args: any) {
    const data = await vercelFetch(`/v1/security/firewall/${args.projectId}/blocked-ips/${encodeURIComponent(args.ipAddress)}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelenableAttackChallengeMode(args: any) {
    const data = await vercelFetch(`/v1/security/firewall/${args.projectId}/challenge-mode`, {
      method: "PATCH",
      body: JSON.stringify({ enabled: args.enabled }),
    });
    return formatResponse(data);
  }

  export async function vercelgetSecurityEvents(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await vercelFetch(`/v1/security/events/${args.projectId}?${params}`);
    return formatResponse(data);
  }

  // ==================== MONITORING & OBSERVABILITY METHODS ====================

  export async function vercelgetRuntimeLogsStream(args: any) {
    const params = new URLSearchParams();
    if (args.follow) params.append("follow", "1");
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await vercelFetch(`/v2/deployments/${args.deploymentId}/events?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetBuildLogs(args: any) {
    const data = await vercelFetch(`/v1/deployments/${args.deploymentId}/builds`);
    return formatResponse(data);
  }

  export async function vercelgetErrorLogs(args: any) {
    const params = new URLSearchParams();
    params.append("type", "error");
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await vercelFetch(`/v2/deployments/${args.deploymentId}/events?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetBandwidthUsage(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await vercelFetch(`/v1/analytics/${args.projectId}/bandwidth?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetFunctionInvocations(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await vercelFetch(`/v1/analytics/${args.projectId}/functions?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetCacheMetrics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await vercelFetch(`/v1/analytics/${args.projectId}/cache?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetTraces(args: any) {
    const params = new URLSearchParams();
    if (args.deploymentId) params.append("deploymentId", args.deploymentId);
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await vercelFetch(`/v1/traces/${args.projectId}?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetPerformanceInsights(args: any) {
    const data = await vercelFetch(`/v1/insights/${args.projectId}/performance`);
    return formatResponse(data);
  }

  export async function vercelgetWebVitals(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await vercelFetch(`/v1/analytics/${args.projectId}/web-vitals?${params}`);
    return formatResponse(data);
  }

  // ==================== BILLING & USAGE METHODS ====================

  export async function vercelgetBillingSummary(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/billing/summary?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetUsageMetrics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/billing/usage?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetInvoice(args: any) {
    const data = await vercelFetch(`/v1/billing/invoices/${args.invoiceId}`);
    return formatResponse(data);
  }

  export async function vercellistInvoices(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await vercelFetch(`/v1/billing/invoices?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetSpendingLimits(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/billing/limits?${params}`);
    return formatResponse(data);
  }

  export async function vercelupdateSpendingLimits(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/billing/limits?${params}`, {
      method: "PATCH",
      body: JSON.stringify({ maxMonthlySpend: args.maxMonthlySpend }),
    });
    return formatResponse(data);
  }

  export async function vercelgetCostBreakdown(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/billing/breakdown?${params}`);
    return formatResponse(data);
  }

  export async function vercelexportUsageReport(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    params.append("format", args.format);
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/billing/export?${params}`);
    return formatResponse(data);
  }

  // ==================== INTEGRATIONS & MARKETPLACE METHODS ====================

  export async function vercellistIntegrations(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/integrations?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetIntegration(args: any) {
    const data = await vercelFetch(`/v1/integrations/${args.integrationId}`);
    return formatResponse(data);
  }

  export async function vercelinstallIntegration(args: any) {
    const body: any = { integrationSlug: args.integrationSlug };
    if (args.teamId) body.teamId = args.teamId;
    if (args.configuration) body.configuration = args.configuration;
    const data = await vercelFetch(`/v1/integrations/install`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return formatResponse(data);
  }

  export async function verceluninstallIntegration(args: any) {
    const data = await vercelFetch(`/v1/integrations/${args.integrationId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercellistIntegrationConfigurations(args: any) {
    const data = await vercelFetch(`/v1/integrations/${args.integrationId}/configurations`);
    return formatResponse(data);
  }

  export async function vercelupdateIntegrationConfiguration(args: any) {
    const data = await vercelFetch(`/v1/integrations/${args.integrationId}/configurations/${args.configurationId}`, {
      method: "PATCH",
      body: JSON.stringify(args.configuration),
    });
    return formatResponse(data);
  }

  export async function vercelgetIntegrationLogs(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await vercelFetch(`/v1/integrations/${args.integrationId}/logs?${params}`);
    return formatResponse(data);
  }

  export async function verceltriggerIntegrationSync(args: any) {
    const data = await vercelFetch(`/v1/integrations/${args.integrationId}/sync`, {
      method: "POST",
    });
    return formatResponse(data);
  }

  // ==================== AUDIT LOGS METHODS ====================

  export async function vercellistAuditLogs(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await vercelFetch(`/v1/audit-logs?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetAuditLog(args: any) {
    const data = await vercelFetch(`/v1/audit-logs/${args.logId}`);
    return formatResponse(data);
  }

  export async function vercelexportAuditLogs(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    params.append("format", args.format);
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/audit-logs/export?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetComplianceReport(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/compliance/${args.reportType}?${params}`);
    return formatResponse(data);
  }

  export async function vercellistAccessEvents(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    if (args.userId) params.append("userId", args.userId);
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await vercelFetch(`/v1/access-events?${params}`);
    return formatResponse(data);
  }

  // ==================== CRON JOBS METHODS ====================

  export async function vercellistCronJobs(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/crons`);
    return formatResponse(data);
  }

  export async function vercelcreateCronJob(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/crons`, {
      method: "POST",
      body: JSON.stringify({
        path: args.path,
        schedule: args.schedule,
      }),
    });
    return formatResponse(data);
  }

  export async function vercelupdateCronJob(args: any) {
    const body: any = {};
    if (args.schedule) body.schedule = args.schedule;
    if (args.enabled !== undefined) body.enabled = args.enabled;
    const data = await vercelFetch(`/v1/projects/${args.projectId}/crons/${args.cronId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return formatResponse(data);
  }

  export async function verceldeleteCronJob(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/crons/${args.cronId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function verceltriggerCronJob(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/crons/${args.cronId}/trigger`, {
      method: "POST",
    });
    return formatResponse(data);
  }

  // ==================== ADVANCED ROUTING METHODS ====================

  export async function vercellistRedirects(args: any) {
    const data = await vercelFetch(`/v9/projects/${args.projectId}`);
    // Redirects are part of project configuration
    return formatResponse(data.redirects || []);
  }

  export async function vercelcreateRedirect(args: any) {
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

  export async function verceldeleteRedirect(args: any) {
    // Get current project config
    const project = await vercelFetch(`/v9/projects/${args.projectId}`);
    const redirects = (project.redirects || []).filter((_: any, i: number) => i.toString() !== args.redirectId);
    const data = await vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ redirects }),
    });
    return formatResponse(data);
  }

  export async function vercellistCustomHeaders(args: any) {
    const data = await vercelFetch(`/v9/projects/${args.projectId}`);
    // Headers are part of project configuration
    return formatResponse(data.headers || []);
  }

  export async function vercelcreateCustomHeader(args: any) {
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

  export async function verceldeleteCustomHeader(args: any) {
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

  export async function vercellistComments(args: any) {
    const data = await vercelFetch(`/v1/deployments/${args.deploymentId}/comments`);
    return formatResponse(data);
  }

  export async function vercelcreateComment(args: any) {
    const body: any = { text: args.text };
    if (args.path) body.path = args.path;
    const data = await vercelFetch(`/v1/deployments/${args.deploymentId}/comments`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return formatResponse(data);
  }

  export async function vercelupdateComment(args: any) {
    const data = await vercelFetch(`/v1/comments/${args.commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ text: args.text }),
    });
    return formatResponse(data);
  }

  export async function verceldeleteComment(args: any) {
    const data = await vercelFetch(`/v1/comments/${args.commentId}`, {
      method: "DELETE",
    });
    return formatResponse(data);
  }

  export async function vercelresolveComment(args: any) {
    const data = await vercelFetch(`/v1/comments/${args.commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ resolved: args.resolved }),
    });
    return formatResponse(data);
  }

  // ==================== GIT INTEGRATION METHODS ====================

  export async function vercellistGitRepositories(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await vercelFetch(`/v1/git/repositories?${params}`);
    return formatResponse(data);
  }

  export async function vercelconnectGitRepository(args: any) {
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

  export async function verceldisconnectGitRepository(args: any) {
    const data = await vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ link: null }),
    });
    return formatResponse(data);
  }

  export async function vercelsyncGitRepository(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/git/sync`, {
      method: "POST",
    });
    return formatResponse(data);
  }

  export async function vercelgetGitIntegrationStatus(args: any) {
    const data = await vercelFetch(`/v9/projects/${args.projectId}`);
    return formatResponse({
      connected: !!data.link,
      link: data.link,
    });
  }

  // EDGE MIDDLEWARE
  export async function vercellistMiddleware(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/middleware`);
    return formatResponse(data);
  }

  export async function vercelgetMiddlewareLogs(args: any) {
    const params = new URLSearchParams();
    if (args.deploymentId) params.append('deploymentId', args.deploymentId);
    if (args.limit) params.append('limit', args.limit.toString());
    const data = await vercelFetch(`/v1/projects/${args.projectId}/middleware/logs?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetMiddlewareMetrics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await vercelFetch(`/v1/projects/${args.projectId}/middleware/metrics?${params}`);
    return formatResponse(data);
  }

  export async function verceltestMiddleware(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/middleware/test`, {
      method: 'POST',
      body: JSON.stringify({ code: args.code, testRequest: args.testRequest })
    });
    return formatResponse(data);
  }

  export async function verceldeployMiddleware(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/middleware`, {
      method: 'POST',
      body: JSON.stringify({ code: args.code, config: args.config })
    });
    return formatResponse(data);
  }

  // MONITORING & OBSERVABILITY
  export async function vercelgetDeploymentHealth(args: any) {
    const data = await vercelFetch(`/v1/deployments/${args.deploymentId}/health`);
    return formatResponse(data);
  }

  export async function vercelgetErrorRate(args: any) {
    const params = new URLSearchParams();
    if (args.deploymentId) params.append('deploymentId', args.deploymentId);
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await vercelFetch(`/v1/projects/${args.projectId}/metrics/errors?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetResponseTime(args: any) {
    const params = new URLSearchParams();
    if (args.deploymentId) params.append('deploymentId', args.deploymentId);
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await vercelFetch(`/v1/projects/${args.projectId}/metrics/response-time?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetUptimeMetrics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await vercelFetch(`/v1/projects/${args.projectId}/metrics/uptime?${params}`);
    return formatResponse(data);
  }

  export async function vercelcreateAlert(args: any) {
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
  export async function vercelinviteTeamMember(args: any) {
    const data = await vercelFetch(`/v1/teams/${args.teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email: args.email, role: args.role || 'MEMBER' })
    });
    return formatResponse(data);
  }

  export async function vercelremoveTeamMember(args: any) {
    const data = await vercelFetch(`/v1/teams/${args.teamId}/members/${args.userId}`, {
      method: 'DELETE'
    });
    return formatResponse(data);
  }

  export async function vercelupdateTeamMemberRole(args: any) {
    const data = await vercelFetch(`/v1/teams/${args.teamId}/members/${args.userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: args.role })
    });
    return formatResponse(data);
  }

  export async function vercelgetTeamActivity(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await vercelFetch(`/v1/teams/${args.teamId}/activity?${params}`);
    return formatResponse(data);
  }

  export async function vercelgetTeamUsage(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await vercelFetch(`/v1/teams/${args.teamId}/usage?${params}`);
    return formatResponse(data);
  }

  // ADVANCED DEPLOYMENT
  export async function vercelpromoteDeployment(args: any) {
    const data = await vercelFetch(`/v13/deployments/${args.deploymentId}/promote`, {
      method: 'POST'
    });
    return formatResponse(data);
  }

  export async function vercelrollbackDeployment(args: any) {
    const data = await vercelFetch(`/v13/deployments/${args.projectId}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ targetDeploymentId: args.targetDeploymentId })
    });
    return formatResponse(data);
  }

  export async function vercelpauseDeployment(args: any) {
    const data = await vercelFetch(`/v1/deployments/${args.deploymentId}/pause`, {
      method: 'POST'
    });
    return formatResponse(data);
  }

  export async function vercelresumeDeployment(args: any) {
    const data = await vercelFetch(`/v1/deployments/${args.deploymentId}/resume`, {
      method: 'POST'
    });
    return formatResponse(data);
  }

  export async function vercelgetDeploymentDiff(args: any) {
    const data = await vercelFetch(`/v1/deployments/diff?deployment1=${args.deploymentId1}&deployment2=${args.deploymentId2}`);
    return formatResponse(data);
  }

  // STORAGE MANAGEMENT
  export async function vercelgetStorageUsage(args: any) {
    const params = args.teamId ? `?teamId=${args.teamId}` : '';
    const data = await vercelFetch(`/v1/storage/usage${params}`);
    return formatResponse(data);
  }

  export async function verceloptimizeStorage(args: any) {
    const params = args.teamId ? `?teamId=${args.teamId}` : '';
    const data = await vercelFetch(`/v1/storage/optimize${params}`);
    return formatResponse(data);
  }

  export async function vercelexportBlobData(args: any) {
    const data = await vercelFetch(`/v1/blob/${args.storeId}/export?format=${args.format || 'json'}`);
    return formatResponse(data);
  }

  export async function vercelimportBlobData(args: any) {
    const data = await vercelFetch(`/v1/blob/${args.storeId}/import`, {
      method: 'POST',
      body: JSON.stringify({ data: args.data, format: args.format || 'json' })
    });
    return formatResponse(data);
  }

  export async function vercelcloneStorage(args: any) {
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
  export async function vercelscanDeploymentSecurity(args: any) {
    const data = await vercelFetch(`/v1/deployments/${args.deploymentId}/security-scan`, {
      method: 'POST'
    });
    return formatResponse(data);
  }

  export async function vercelgetSecurityHeaders(args: any) {
    const data = await vercelFetch(`/v1/projects/${args.projectId}/security-headers`);
    return formatResponse(data);
  }

  export async function vercelupdateSecurityHeaders(args: any) {
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
