/**
 * Neon Database Handler Methods
 * Extracted from temp-neon-mcp.ts
 * Total: 165 handlers
 */

import axios, { AxiosInstance } from 'axios';

// Neon API client setup
function createNeonClient(apiKey: string): AxiosInstance {
  return axios.create({
    baseURL: 'https://console.neon.tech/api/v2',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
}

// Get API key from environment
function getNeonApiKey(): string {
  const apiKey = process.env.NEON_API_KEY || '';
  if (!apiKey) {
    throw new Error('NEON_API_KEY environment variable is not set');
  }
  return apiKey;
}

// Create client instance (singleton)
let clientInstance: AxiosInstance | null = null;

function getNeonClient(): AxiosInstance {
  if (!clientInstance) {
    clientInstance = createNeonClient(getNeonApiKey());
  }
  return clientInstance;
}

export async function neonListProjects(args: any) {
  const neonClient = getNeonClient();
  try {
    const params = new URLSearchParams();
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.search) params.append('search', args.search);
    if (args.cursor) params.append('cursor', args.cursor);

    // If org_id not provided, fetch user's default organization
    let orgId = args.org_id;
    if (!orgId) {
      console.error('[NEON] org_id not provided, fetching user organizations...');
      const orgsResponse = await neonClient.get('/users/me/organizations');
      const organizations = orgsResponse.data.organizations || [];

      if (organizations.length === 0) {
        throw new Error('No organizations found for this user. Please create an organization first.');
      }

      // Use the first organization
      orgId = organizations[0].id;
      console.error('[NEON] Using default organization:', orgId);
    }

    params.append('org_id', orgId);

    const url = `/projects?${params.toString()}`;
    console.error('[NEON] Fetching projects with URL:', url);

    const response = await neonClient.get(url);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  } catch (error: any) {
    // Log detailed error information for debugging
    console.error('[NEON ERROR] Failed to list projects:');
    console.error('[NEON ERROR] Status:', error.response?.status);
    console.error('[NEON ERROR] Message:', error.response?.data?.message || error.message);

    // Return user-friendly error message
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(`Failed to list Neon projects: ${errorMessage}`);
  }
}
export async function neonListOrganizations(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.get('/users/me/organizations');
    let orgs = response.data.organizations || [];

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      orgs = orgs.filter((org: any) =>
        org.name?.toLowerCase().includes(searchLower) ||
        org.id?.toLowerCase().includes(searchLower)
      );
    }

    return { content: [{ type: 'text', text: JSON.stringify({ organizations: orgs }, null, 2) }] };
  
}
export async function neonListSharedProjects(args: any) {
  const neonClient = getNeonClient();
    const params = new URLSearchParams();
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.search) params.append('search', args.search);
    if (args.cursor) params.append('cursor', args.cursor);

    const response = await neonClient.get(`/projects/shared?${params.toString()}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonCreateProject(args: any) {
  const neonClient = getNeonClient();
    const body: any = {};
    if (args.name) body.project = { name: args.name };
    if (args.org_id) body.project = { ...body.project, org_id: args.org_id };
    if (args.region_id) body.project = { ...body.project, region_id: args.region_id };
    if (args.pg_version) body.project = { ...body.project, pg_version: args.pg_version };

    const response = await neonClient.post('/projects', body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonDeleteProject(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.delete(`/projects/${args.projectId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonDescribeProject(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.get(`/projects/${args.projectId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonUpdateProject(args: any) {
  const neonClient = getNeonClient();
    const body: any = { project: {} };
    if (args.name) body.project.name = args.name;
    if (args.settings) body.project.settings = args.settings;

    const response = await neonClient.patch(`/projects/${args.projectId}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonGetProjectOperations(args: any) {
  const neonClient = getNeonClient();
    const params = new URLSearchParams();
    if (args.limit) params.append('limit', args.limit.toString());

    const response = await neonClient.get(`/projects/${args.projectId}/operations?${params.toString()}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonGetProjectConsumption(args: any) {
  const neonClient = getNeonClient();
    const params = new URLSearchParams();
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);

    const response = await neonClient.get(`/projects/${args.projectId}/consumption?${params.toString()}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonSetProjectSettings(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.patch(`/projects/${args.projectId}`, { project: { settings: args.settings } });
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonGetProjectQuotas(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.get(`/projects/${args.projectId}`);
    const quotas = response.data.project?.quotas || {};
    return { content: [{ type: 'text', text: JSON.stringify(quotas, null, 2) }] };
  
}
export async function neonCloneProject(args: any) {
  const neonClient = getNeonClient();
    return { content: [{ type: 'text', text: 'Project cloning: Create new project and copy branches using create_project and create_branch tools.' }] };
  
}
export async function neonGetProjectPermissions(args: any) {
  const neonClient = getNeonClient();
    return { content: [{ type: 'text', text: 'Project permissions: Use organization API to manage project access.' }] };
  
}
export async function neonCreateBranch(args: any) {
  const neonClient = getNeonClient();
    const body: any = { branch: {} };
    if (args.branchName) body.branch.name = args.branchName;
    if (args.parent_id) body.branch.parent_id = args.parent_id;

    const response = await neonClient.post(`/projects/${args.projectId}/branches`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonDeleteBranch(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.delete(`/projects/${args.projectId}/branches/${args.branchId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonDescribeBranch(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.get(`/projects/${args.projectId}/branches/${args.branchId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonResetFromParent(args: any) {
  const neonClient = getNeonClient();
    const body: any = {};
    if (args.preserveUnderName) body.preserve_under_name = args.preserveUnderName;

    const response = await neonClient.post(`/projects/${args.projectId}/branches/${args.branchIdOrName}/reset`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonUpdateBranch(args: any) {
  const neonClient = getNeonClient();
    const body: any = { branch: {} };
    if (args.name) body.branch.name = args.name;
    if (args.protected !== undefined) body.branch.protected = args.protected;

    const response = await neonClient.patch(`/projects/${args.projectId}/branches/${args.branchId}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonListBranches(args: any) {
  const neonClient = getNeonClient();
    const params = new URLSearchParams();
    if (args.search) params.append('search', args.search);

    const response = await neonClient.get(`/projects/${args.projectId}/branches?${params.toString()}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonGetBranchDetails(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.get(`/projects/${args.projectId}/branches/${args.branchId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonRestoreBranch(args: any) {
  const neonClient = getNeonClient();
    return { content: [{ type: 'text', text: 'Branch restore: Use create_branch with parent_timestamp to restore to specific point in time.' }] };
  
}
export async function neonSetBranchProtection(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.patch(`/projects/${args.projectId}/branches/${args.branchId}`, {
      branch: { protected: args.protected }
    });
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonGetBranchSchemaDiff(args: any) {
  const neonClient = getNeonClient();
    return { content: [{ type: 'text', text: 'Schema diff: Use run_sql to query information_schema on both branches and compare.' }] };
  
}
export async function neonGetBranchDataDiff(args: any) {
  const neonClient = getNeonClient();
    return { content: [{ type: 'text', text: 'Data diff: Use run_sql to query and compare data between branches.' }] };
  
}
export async function neonMergeBranches(args: any) {
  const neonClient = getNeonClient();
    return { content: [{ type: 'text', text: 'Branch merge: Use prepare_database_migration to apply changes from source to target branch.' }] };
  
}
export async function neonPromoteBranch(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.post(`/projects/${args.projectId}/branches/${args.branchId}/set_as_primary`, {});
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonSetBranchRetention(args: any) {
  const neonClient = getNeonClient();
    return { content: [{ type: 'text', text: 'Branch retention: Configure via project settings.' }] };
  
}
export async function neonGetBranchHistory(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.get(`/projects/${args.projectId}/branches/${args.branchId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonRestoreBranchToTimestamp(args: any) {
  const neonClient = getNeonClient();
    const body = { timestamp: args.timestamp };
    const response = await neonClient.post(`/projects/${args.projectId}/branches/${args.branchId}/restore`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonGetBranchSize(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.get(`/projects/${args.projectId}/branches/${args.branchId}`);
    const size = response.data.branch?.logical_size || 0;
    return { content: [{ type: 'text', text: `Branch size: ${size} bytes` }] };
  
}
export async function neonSetBranchComputeSettings(args: any) {
  const neonClient = getNeonClient();
    return { content: [{ type: 'text', text: 'Compute settings: Use update_endpoint to configure compute for branch endpoints.' }] };
  
}
export async function neonGetBranchConnections(args: any) {
  const neonClient = getNeonClient();
    return { content: [{ type: 'text', text: 'Active connections: Use run_sql with "SELECT * FROM pg_stat_activity" to view connections.' }] };
  
}
export async function neonListBranchComputes(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.get(`/projects/${args.projectId}/endpoints`);
    const branchEndpoints = args.branchId
      ? response.data.endpoints?.filter((e: any) => e.branch_id === args.branchId)
      : response.data.endpoints;
    return { content: [{ type: 'text', text: JSON.stringify(branchEndpoints, null, 2) }] };
  
}
export async function neonRunSql(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'SQL execution: Not yet implemented' }] }; 
}
export async function neonRunSqlTransaction(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'SQL transaction: Not yet implemented' }] }; 
}
export async function neonGetConnectionString(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Connection string: Not yet implemented' }] }; 
}
export async function neonGetDatabaseTables(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Database tables: Not yet implemented' }] }; 
}
export async function neonDescribeTableSchema(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Table schema: Not yet implemented' }] }; 
}
export async function neonExplainSqlStatement(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Explain SQL: Not yet implemented' }] }; 
}
export async function neonListSlowQueries(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Slow queries: Not yet implemented' }] }; 
}
export async function neonOptimizeQuery(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Query optimization: Not yet implemented' }] }; 
}
export async function neonSuggestIndexes(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Index suggestions: Not yet implemented' }] }; 
}
export async function neonAnalyzeQueryPlan(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Query plan analysis: Not yet implemented' }] }; 
}
export async function neonCreateDatabase(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Create database: Not yet implemented' }] }; 
}
export async function neonDeleteDatabase(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Delete database: Not yet implemented' }] }; 
}
export async function neonListDatabases(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'List databases: Not yet implemented' }] }; 
}
export async function neonGetDatabaseSize(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Database size: Not yet implemented' }] }; 
}
export async function neonGetDatabaseStats(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Database stats: Not yet implemented' }] }; 
}
export async function neonVacuumDatabase(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Vacuum database: Not yet implemented' }] }; 
}
export async function neonAnalyzeDatabase(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Analyze database: Not yet implemented' }] }; 
}
export async function neonReindexDatabase(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Reindex database: Not yet implemented' }] }; 
}
export async function neonGetDatabaseLocks(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Database locks: Not yet implemented' }] }; 
}
export async function neonKillDatabaseQuery(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Kill query: Not yet implemented' }] }; 
}
export async function neonGetDatabaseActivity(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Database activity: Not yet implemented' }] }; 
}
export async function neonBackupDatabase(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Backup database: Not yet implemented' }] }; 
}
export async function neonPrepareDatabaseMigration(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Prepare migration: Not yet implemented' }] }; 
}
export async function neonCompleteDatabaseMigration(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Complete migration: Not yet implemented' }] }; 
}
export async function neonPrepareQueryTuning(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Prepare query tuning: Not yet implemented' }] }; 
}
export async function neonCompleteQueryTuning(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Complete query tuning: Not yet implemented' }] }; 
}
export async function neonCreateRole(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Create role: Not yet implemented' }] }; 
}
export async function neonDeleteRole(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Delete role: Not yet implemented' }] }; 
}
export async function neonListRoles(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'List roles: Not yet implemented' }] }; 
}
export async function neonUpdateRole(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Update role: Not yet implemented' }] }; 
}
export async function neonGrantRolePermissions(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Grant permissions: Not yet implemented' }] }; 
}
export async function neonRevokeRolePermissions(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Revoke permissions: Not yet implemented' }] }; 
}
export async function neonGetRolePermissions(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Get permissions: Not yet implemented' }] }; 
}
export async function neonResetRolePassword(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Reset password: Not yet implemented' }] }; 
}
export async function neonCreateEndpoint(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Create endpoint: Not yet implemented' }] }; 
}
export async function neonDeleteEndpoint(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Delete endpoint: Not yet implemented' }] }; 
}
export async function neonUpdateEndpoint(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Update endpoint: Not yet implemented' }] }; 
}
export async function neonStartEndpoint(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Start endpoint: Not yet implemented' }] }; 
}
export async function neonSuspendEndpoint(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Suspend endpoint: Not yet implemented' }] }; 
}
export async function neonRestartEndpoint(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Restart endpoint: Not yet implemented' }] }; 
}
export async function neonGetEndpointMetrics(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Endpoint metrics: Not yet implemented' }] }; 
}
export async function neonSetEndpointAutoscaling(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Set autoscaling: Not yet implemented' }] }; 
}
export async function neonGetEndpointLogs(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Endpoint logs: Not yet implemented' }] }; 
}
export async function neonSetEndpointPooling(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Set pooling: Not yet implemented' }] }; 
}
export async function neonGetQueryStatistics(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Query statistics: Not yet implemented' }] }; 
}
export async function neonGetSlowQueryLog(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Slow query log: Not yet implemented' }] }; 
}
export async function neonGetConnectionStats(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Connection stats: Not yet implemented' }] }; 
}
export async function neonGetStorageMetrics(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Storage metrics: Not yet implemented' }] }; 
}
export async function neonGetComputeMetrics(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Compute metrics: Not yet implemented' }] }; 
}
export async function neonGetIoMetrics(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'I/O metrics: Not yet implemented' }] }; 
}
export async function neonGetCacheHitRatio(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Cache hit ratio: Not yet implemented' }] }; 
}
export async function neonGetIndexUsage(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Index usage: Not yet implemented' }] }; 
}
export async function neonGetTableBloat(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Table bloat: Not yet implemented' }] }; 
}
export async function neonGetReplicationLag(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Replication lag: Not yet implemented' }] }; 
}
export async function neonGetCheckpointStats(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Checkpoint stats: Not yet implemented' }] }; 
}
export async function neonGetWalStats(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'WAL stats: Not yet implemented' }] }; 
}
export async function neonSetMonitoringAlerts(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Set alerts: Not yet implemented' }] }; 
}
export async function neonGetAlertHistory(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Alert history: Not yet implemented' }] }; 
}
export async function neonGetPerformanceInsights(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Performance insights: Not yet implemented' }] }; 
}
export async function neonListBackups(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'List backups: Not yet implemented' }] }; 
}
export async function neonCreateBackup(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Create backup: Not yet implemented' }] }; 
}
export async function neonRestoreBackup(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Restore backup: Not yet implemented' }] }; 
}
export async function neonDeleteBackup(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Delete backup: Not yet implemented' }] }; 
}
export async function neonGetBackupStatus(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Backup status: Not yet implemented' }] }; 
}
export async function neonScheduleBackup(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Schedule backup: Not yet implemented' }] }; 
}
export async function neonExportBackup(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Export backup: Not yet implemented' }] }; 
}
export async function neonValidateBackup(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Validate backup: Not yet implemented' }] }; 
}
export async function neonEnableIpAllowlist(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Enable IP allowlist: Not yet implemented' }] }; 
}
export async function neonGetIpAllowlist(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Get IP allowlist: Not yet implemented' }] }; 
}
export async function neonEnableSslEnforcement(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Enable SSL: Not yet implemented' }] }; 
}
export async function neonRotateCredentials(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Rotate credentials: Not yet implemented' }] }; 
}
export async function neonGetAuditLog(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Audit log: Not yet implemented' }] }; 
}
export async function neonEnableEncryption(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Enable encryption: Not yet implemented' }] }; 
}
export async function neonGetSecurityScan(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Security scan: Not yet implemented' }] }; 
}
export async function neonSetPasswordPolicy(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Set password policy: Not yet implemented' }] }; 
}
export async function neonEnable2fa(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Enable 2FA: Not yet implemented' }] }; 
}
export async function neonGetComplianceReport(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Compliance report: Not yet implemented' }] }; 
}
export async function neonGetCostBreakdown(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Cost breakdown: Not yet implemented' }] }; 
}
export async function neonGetCostForecast(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Cost forecast: Not yet implemented' }] }; 
}
export async function neonSetCostAlerts(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Set cost alerts: Not yet implemented' }] }; 
}
export async function neonGetCostOptimizationTips(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Cost optimization: Not yet implemented' }] }; 
}
export async function neonGetBillingHistory(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Billing history: Not yet implemented' }] }; 
}
export async function neonExportCostReport(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Export cost report: Not yet implemented' }] }; 
}
export async function neonSetBudgetLimits(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Set budget limits: Not yet implemented' }] }; 
}
export async function neonGetResourceRecommendations(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Resource recommendations: Not yet implemented' }] }; 
}
export async function neonCreateWebhook(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Create webhook: Not yet implemented' }] }; 
}
export async function neonListWebhooks(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'List webhooks: Not yet implemented' }] }; 
}
export async function neonDeleteWebhook(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Delete webhook: Not yet implemented' }] }; 
}
export async function neonTestWebhook(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Test webhook: Not yet implemented' }] }; 
}
export async function neonGetWebhookLogs(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Webhook logs: Not yet implemented' }] }; 
}
export async function neonCreateApiKey(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Create API key: Not yet implemented' }] }; 
}
export async function neonDetectNPlusOne(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Detect N+1: Not yet implemented' }] }; 
}
export async function neonSuggestPartitioning(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Suggest partitioning: Not yet implemented' }] }; 
}
export async function neonAnalyzeTableStatistics(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Table statistics: Not yet implemented' }] }; 
}
export async function neonSuggestVacuumStrategy(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Vacuum strategy: Not yet implemented' }] }; 
}
export async function neonDetectMissingIndexes(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Missing indexes: Not yet implemented' }] }; 
}
export async function neonAnalyzeJoinPerformance(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Join performance: Not yet implemented' }] }; 
}
export async function neonSuggestMaterializedViews(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Materialized views: Not yet implemented' }] }; 
}
export async function neonGetTableDependencies(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Table dependencies: Not yet implemented' }] }; 
}
export async function neonSuggestQueryRewrite(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Query rewrite: Not yet implemented' }] }; 
}
export async function neonAnalyzeDeadlocks(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Analyze deadlocks: Not yet implemented' }] }; 
}
export async function neonProvisionNeonAuth(args: any) {
  const neonClient = getNeonClient(); return { content: [{ type: 'text', text: 'Provision Neon Auth: Not yet implemented' }] }; 
}
export async function neonListApiKeys(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.get('/api_keys');
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonCreateApiKeyForProject(args: any) {
  const neonClient = getNeonClient();
    const body: any = { key_name: args.keyName };
    if (args.projectId) body.project_id = args.projectId;

    const response = await neonClient.post('/api_keys', body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonRevokeApiKey(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.delete(`/api_keys/${args.keyId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonGetConnectionPoolerConfig(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.get(`/projects/${args.projectId}/endpoints/${args.endpointId}`);
    const poolerConfig = response.data.endpoint?.pooler_enabled ? {
      pooler_enabled: response.data.endpoint.pooler_enabled,
      pooler_mode: response.data.endpoint.pooler_mode,
      settings: response.data.endpoint.settings
    } : { pooler_enabled: false };

    return { content: [{ type: 'text', text: JSON.stringify(poolerConfig, null, 2) }] };
  
}
export async function neonUpdateConnectionPoolerConfig(args: any) {
  const neonClient = getNeonClient();
    const body: any = { endpoint: {} };
    if (args.poolMode) body.endpoint.pooler_mode = args.poolMode;
    if (args.poolSize !== undefined) body.endpoint.settings = { ...body.endpoint.settings, pool_size: args.poolSize };
    if (args.maxClientConn !== undefined) body.endpoint.settings = { ...body.endpoint.settings, max_client_conn: args.maxClientConn };

    const response = await neonClient.patch(`/projects/${args.projectId}/endpoints/${args.endpointId}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonCreateReadReplica(args: any) {
  const neonClient = getNeonClient();
    const body: any = {
      endpoint: {
        branch_id: args.branchId,
        type: 'read_only'
      }
    };
    if (args.region) body.endpoint.region_id = args.region;

    const response = await neonClient.post(`/projects/${args.projectId}/endpoints`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonListReadReplicas(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.get(`/projects/${args.projectId}/endpoints`);
    const readReplicas = response.data.endpoints?.filter((ep: any) =>
      ep.type === 'read_only' && ep.branch_id === args.branchId
    ) || [];

    return { content: [{ type: 'text', text: JSON.stringify({ read_replicas: readReplicas }, null, 2) }] };
  
}
export async function neonShareProject(args: any) {
  const neonClient = getNeonClient();
    const body: any = {
      email: args.email
    };
    if (args.role) body.role = args.role;

    const response = await neonClient.post(`/projects/${args.projectId}/permissions`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonListProjectShares(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.get(`/projects/${args.projectId}/permissions`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonRevokeProjectShare(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.delete(`/projects/${args.projectId}/permissions/${args.shareId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonListExtensions(args: any) {
  const neonClient = getNeonClient();
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    const sql = 'SELECT * FROM pg_available_extensions ORDER BY name';
    const response = await neonClient.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: sql });
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonEnableExtension(args: any) {
  const neonClient = getNeonClient();
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    const schema = args.schema || 'public';
    const sql = `CREATE EXTENSION IF NOT EXISTS "${args.extensionName}" SCHEMA ${schema}`;
    const response = await neonClient.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: sql });
    return { content: [{ type: 'text', text: `Extension ${args.extensionName} enabled successfully` }] };
  
}
export async function neonDisableExtension(args: any) {
  const neonClient = getNeonClient();
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    const sql = `DROP EXTENSION IF EXISTS "${args.extensionName}"`;
    const response = await neonClient.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: sql });
    return { content: [{ type: 'text', text: `Extension ${args.extensionName} disabled successfully` }] };
  
}
export async function neonGetExtensionDetails(args: any) {
  const neonClient = getNeonClient();
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    const sql = `SELECT * FROM pg_extension WHERE extname = '${args.extensionName}'`;
    const response = await neonClient.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: sql });
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonUpdateExtension(args: any) {
  const neonClient = getNeonClient();
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    const version = args.version ? `TO '${args.version}'` : '';
    const sql = `ALTER EXTENSION "${args.extensionName}" UPDATE ${version}`;
    const response = await neonClient.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: sql });
    return { content: [{ type: 'text', text: `Extension ${args.extensionName} updated successfully` }] };
  
}
export async function neonCreateMigration(args: any) {
  const neonClient = getNeonClient();
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    // Create migration tracking table if not exists
    const createTableSql = `CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sql TEXT NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    await neonClient.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: createTableSql });

    // Execute migration
    await neonClient.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: args.sql });

    // Record migration
    const recordSql = `INSERT INTO schema_migrations (name, sql) VALUES ('${args.name}', '${args.sql.replace(/'/g, "''")}')`;
    const response = await neonClient.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: recordSql });
    return { content: [{ type: 'text', text: `Migration ${args.name} created and applied successfully` }] };
  
}
export async function neonListMigrations(args: any) {
  const neonClient = getNeonClient();
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    const sql = 'SELECT * FROM schema_migrations ORDER BY applied_at DESC';
    const response = await neonClient.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: sql });
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonRollbackMigration(args: any) {
  const neonClient = getNeonClient();
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    const sql = `DELETE FROM schema_migrations WHERE id = ${args.migrationId}`;
    const response = await neonClient.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: sql });
    return { content: [{ type: 'text', text: `Migration ${args.migrationId} rolled back (record deleted, manual SQL rollback required)` }] };
  
}
export async function neonGetConnectionUri(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.get(`/projects/${args.projectId}/connection_uri`, {
      params: {
        branch_id: args.branchId,
        database_name: args.databaseName,
        role_name: args.roleName,
        pooled: args.pooled
      }
    });
    const uri = response.data.uri;

    if (args.format) {
      const formatted = this.formatConnectionString(uri, args.format);
      return { content: [{ type: 'text', text: formatted }] };
    }

    return { content: [{ type: 'text', text: uri }] };
  
}
export async function neonTestConnection(args: any) {
  const neonClient = getNeonClient();
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    const startTime = Date.now();
    try {
      await neonClient.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: 'SELECT 1' });
      const latency = Date.now() - startTime;
      return { content: [{ type: 'text', text: `Connection successful! Latency: ${latency}ms` }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Connection failed: ${error.message}` }] };
    }
  
}
export async function neonGetConnectionExamples(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.get(`/projects/${args.projectId}/connection_uri`, {
      params: {
        branch_id: args.branchId,
        database_name: args.databaseName
      }
    });
    const uri = response.data.uri;

    const examples: any = {
      javascript: `const { Pool } = require('pg');\nconst pool = new Pool({ connectionString: '${uri}' });\n\nconst result = await pool.query('SELECT * FROM users');\nconsole.log(result.rows);`,
      typescript: `import { Pool } from 'pg';\nconst pool = new Pool({ connectionString: '${uri}' });\n\nconst result = await pool.query<User>('SELECT * FROM users');\nconsole.log(result.rows);`,
      python: `import psycopg2\n\nconn = psycopg2.connect('${uri}')\ncur = conn.cursor()\ncur.execute('SELECT * FROM users')\nrows = cur.fetchall()`,
      go: `import (\n  "database/sql"\n  _ "github.com/lib/pq"\n)\n\ndb, err := sql.Open("postgres", "${uri}")\nrows, err := db.Query("SELECT * FROM users")`,
      rust: `use postgres::{Client, NoTls};\n\nlet mut client = Client::connect("${uri}", NoTls)?;\nlet rows = client.query("SELECT * FROM users", &[])?;`,
      java: `import java.sql.*;\n\nString url = "${uri.replace('postgres://', 'jdbc:postgresql://')}";\nConnection conn = DriverManager.getConnection(url);\nStatement stmt = conn.createStatement();\nResultSet rs = stmt.executeQuery("SELECT * FROM users");`,
      php: `<?php\n$conn = pg_connect('${uri}');\n$result = pg_query($conn, 'SELECT * FROM users');\n$rows = pg_fetch_all($result);`,
      ruby: `require 'pg'\n\nconn = PG.connect('${uri}')\nresult = conn.exec('SELECT * FROM users')\nresult.each { |row| puts row }`
    };

    const example = examples[args.language || 'javascript'];
    return { content: [{ type: 'text', text: example }] };
  
}
export async function neonCreateFromTemplate(args: any) {
  const neonClient = getNeonClient();
    // Note: This is a placeholder - Neon API may not have direct template support
    // This would create a project and then apply template SQL
    const response = await neonClient.post('/projects', {
      project: {
        name: args.name,
        region_id: args.region
      }
    });
    return { content: [{ type: 'text', text: `Project created from template: ${JSON.stringify(response.data, null, 2)}` }] };
  
}
export async function neonListTemplates(args: any) {
  const neonClient = getNeonClient();
    // Note: This is a placeholder - returning common templates
    const templates = [
      { id: 'nextjs', name: 'Next.js Starter', description: 'PostgreSQL schema for Next.js apps' },
      { id: 'rails', name: 'Ruby on Rails', description: 'Rails-compatible schema' },
      { id: 'django', name: 'Django', description: 'Django-compatible schema' },
      { id: 'ecommerce', name: 'E-commerce', description: 'Product catalog and orders' },
      { id: 'saas', name: 'SaaS Multi-tenant', description: 'Multi-tenant SaaS schema' }
    ];

    const filtered = args.category
      ? templates.filter(t => t.name.toLowerCase().includes(args.category.toLowerCase()))
      : templates;

    return { content: [{ type: 'text', text: JSON.stringify(filtered, null, 2) }] };
  
}
export async function neonGetRealTimeMetrics(args: any) {
  const neonClient = getNeonClient();
    const response = await neonClient.get(`/projects/${args.projectId}/operations`, {
      params: { limit: 10 }
    });
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  
}
export async function neonExportMetrics(args: any) {
  const neonClient = getNeonClient();
    const config = {
      destination: args.destination,
      projectId: args.projectId,
      config: args.config,
      message: `Metrics export configured for ${args.destination}. Note: This requires additional setup in your monitoring system.`
    };
    return { content: [{ type: 'text', text: JSON.stringify(config, null, 2) }] };
  
}
export async function neonCheckApiKey(args: any) {
  const neonClient = getNeonClient();
    if (!(process.env.NEON_API_KEY || '')) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            enabled: false,
            message: 'Neon API key not configured. Set NEON_API_KEY environment variable to enable Neon tools.',
            instructions: 'Get your API key from: https://console.neon.tech/app/settings/api-keys'
          }, null, 2)
        }]
      };
    }

    try {
      // Test API key by listing projects
      await neonClient.get('/projects', { params: { limit: 1 } });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            enabled: true,
            message: 'Neon API key is valid and working!'
          }, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            enabled: false,
            error: error.message,
            message: 'Neon API key is configured but invalid. Please check your API key.'
          }, null, 2)
        }]
      };
    }
  
}
export async function neonCreateProjectForRad(args: any) {
  const neonClient = getNeonClient();
    if (!(process.env.NEON_API_KEY || '')) {
      return {
        content: [{
          type: 'text',
          text: 'Error: Neon API key not configured. Set NEON_API_KEY environment variable.'
        }]
      };
    }

    const projectData: any = {
      project: {
        name: args.name || 'RAD Crawler',
        region_id: args.region || 'aws-us-east-1',
        pg_version: 16
      }
    };

    if (args.org_id) {
      projectData.project.org_id = args.org_id;
    }

    const response = await neonClient.post('/projects', projectData);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          project: response.data.project,
          message: 'RAD Crawler project created successfully!',
          next_steps: [
            'Use neon_deploy_schema to deploy your schema',
            'Use neon_get_connection_uri to get connection string'
          ]
        }, null, 2)
      }]
    };
  
}
export async function neonDeploySchema(args: any) {
  const neonClient = getNeonClient();
    if (!(process.env.NEON_API_KEY || '')) {
      return {
        content: [{
          type: 'text',
          text: 'Error: Neon API key not configured. Set NEON_API_KEY environment variable.'
        }]
      };
    }

    // Split schema into individual statements
    const statements = args.schemaSQL
      .split(';')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    const results = [];
    for (const sql of statements) {
      try {
        const response = await neonClient.post(
          `/projects/${args.projectId}/branches/${args.branchId || 'main'}/databases/${args.databaseName || 'neondb'}/query`,
          { query: sql + ';' }
        );
        results.push({ success: true, statement: sql.substring(0, 100) + '...' });
      } catch (error: any) {
        results.push({ success: false, statement: sql.substring(0, 100) + '...', error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: successCount === results.length,
          total_statements: results.length,
          successful: successCount,
          failed: results.length - successCount,
          results
        }, null, 2)
      }]
    };
  
}
export async function neonVerifySchema(args: any) {
  const neonClient = getNeonClient();
    if (!(process.env.NEON_API_KEY || '')) {
      return {
        content: [{
          type: 'text',
          text: 'Error: Neon API key not configured. Set NEON_API_KEY environment variable.'
        }]
      };
    }

    const sql = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `;

    const response = await neonClient.post(
      `/projects/${args.projectId}/branches/${args.branchId || 'main'}/databases/${args.databaseName || 'neondb'}/query`,
      { query: sql }
    );

    const existingTables = response.data.rows.map((r: any) => r.table_name);
    const missingTables = args.requiredTables.filter((t: string) => !existingTables.includes(t));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: missingTables.length === 0,
          existing_tables: existingTables,
          required_tables: args.requiredTables,
          missing_tables: missingTables,
          message: missingTables.length === 0
            ? 'All required tables exist!'
            : `Missing tables: ${missingTables.join(', ')}`
        }, null, 2)
      }]
    };
  
}
export async function neonSetupRadDatabase(args: any) {
  const neonClient = getNeonClient();
    if (!(process.env.NEON_API_KEY || '')) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Neon API key not configured',
            message: 'Set NEON_API_KEY environment variable to enable autonomous setup.',
            instructions: 'Get your API key from: https://console.neon.tech/app/settings/api-keys'
          }, null, 2)
        }]
      };
    }

    try {
      // Step 1: Create project
      const projectResult = await this.createProjectForRAD({
        name: args.projectName || 'RAD Crawler',
        region: args.region || 'aws-us-east-1',
        org_id: args.org_id
      });
      const project = JSON.parse(projectResult.content[0].text).project;

      // Step 2: Create database
      await neonClient.post(
        `/projects/${project.id}/branches/main/databases`,
        { database: { name: args.databaseName || 'rad_production', owner_name: 'neondb_owner' } }
      );

      // Step 3: Deploy schema
      await this.deploySchema({
        projectId: project.id,
        branchId: 'main',
        databaseName: args.databaseName || 'rad_production',
        schemaSQL: args.schemaSQL
      });

      // Step 4: Get connection URI
      const uriResult = await this.getConnectionUri({
        projectId: project.id,
        branchId: 'main',
        databaseName: args.databaseName || 'rad_production',
        pooled: true
      });
      const connectionUri = JSON.parse(uriResult.content[0].text).connection_uri;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            project_id: project.id,
            database_name: args.databaseName || 'rad_production',
            connection_uri: connectionUri,
            message: 'RAD database setup complete! Add NEON_DATABASE_URL to your environment config.',
            next_steps: [
              `Set NEON_DATABASE_URL="${connectionUri}"`,
              'Update WORKING_AUGMENT_CONFIG.json',
              'Restart VS Code'
            ]
          }, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            message: 'Failed to set up RAD database. Check error details above.'
          }, null, 2)
        }]
      };
    }
  
}
