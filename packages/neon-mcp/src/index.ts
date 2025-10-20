#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';

class NeonMCP {
  private server: Server;
  private apiKey: string;
  private client: AxiosInstance;
  private baseUrl = 'https://console.neon.tech/api/v2';

  constructor(apiKey: string) {
    this.server = new Server(
      { name: '@robinsonai/neon-mcp', version: '2.0.0' },
      { capabilities: { tools: {} } }
    );
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // PROJECT MANAGEMENT (13 tools)
        { name: 'list_projects', description: 'Lists the first 10 Neon projects. Increase limit or use search to filter.', inputSchema: { type: 'object', properties: { limit: { type: 'number' }, search: { type: 'string' }, cursor: { type: 'string' }, org_id: { type: 'string' } } } },
        { name: 'list_organizations', description: 'Lists all organizations the user has access to.', inputSchema: { type: 'object', properties: { search: { type: 'string' } } } },
        { name: 'list_shared_projects', description: 'Lists projects shared with the current user.', inputSchema: { type: 'object', properties: { limit: { type: 'number' }, search: { type: 'string' }, cursor: { type: 'string' } } } },
        { name: 'create_project', description: 'Create a new Neon project.', inputSchema: { type: 'object', properties: { name: { type: 'string' }, org_id: { type: 'string' }, region_id: { type: 'string' }, pg_version: { type: 'number' } } } },
        { name: 'delete_project', description: 'Delete a Neon project.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'describe_project', description: 'Get detailed project information.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'update_project', description: 'Update project settings.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, name: { type: 'string' }, settings: { type: 'object' } }, required: ['projectId'] } },
        { name: 'get_project_operations', description: 'List recent operations on a project.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, limit: { type: 'number' } }, required: ['projectId'] } },
        { name: 'get_project_consumption', description: 'Get consumption metrics (compute hours, storage).', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' } }, required: ['projectId'] } },
        { name: 'set_project_settings', description: 'Configure project-level settings.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, settings: { type: 'object' } }, required: ['projectId', 'settings'] } },
        { name: 'get_project_quotas', description: 'View current quotas and limits.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'clone_project', description: 'Clone entire project with all branches.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, name: { type: 'string' } }, required: ['projectId'] } },
        { name: 'get_project_permissions', description: 'List users/roles with access to project.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },

        // BRANCH MANAGEMENT (20 tools)
        { name: 'create_branch', description: 'Create a new branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchName: { type: 'string' }, parent_id: { type: 'string' } }, required: ['projectId'] } },
        { name: 'delete_branch', description: 'Delete a branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'describe_branch', description: 'Get tree view of all objects in a branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'reset_from_parent', description: 'Reset branch to parent state.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchIdOrName: { type: 'string' }, preserveUnderName: { type: 'string' } }, required: ['projectId', 'branchIdOrName'] } },
        { name: 'update_branch', description: 'Update branch settings.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, name: { type: 'string' }, protected: { type: 'boolean' } }, required: ['projectId', 'branchId'] } },
        { name: 'list_branches', description: 'List all branches with filtering.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, search: { type: 'string' } }, required: ['projectId'] } },
        { name: 'get_branch_details', description: 'Get detailed branch information.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'restore_branch', description: 'Restore deleted branch from backup.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, timestamp: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'set_branch_protection', description: 'Protect/unprotect branches.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, protected: { type: 'boolean' } }, required: ['projectId', 'branchId', 'protected'] } },
        { name: 'get_branch_schema_diff', description: 'Compare schemas between branches.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, sourceBranchId: { type: 'string' }, targetBranchId: { type: 'string' } }, required: ['projectId', 'sourceBranchId', 'targetBranchId'] } },
        { name: 'get_branch_data_diff', description: 'Compare data between branches.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, sourceBranchId: { type: 'string' }, targetBranchId: { type: 'string' }, tableName: { type: 'string' } }, required: ['projectId', 'sourceBranchId', 'targetBranchId'] } },
        { name: 'merge_branches', description: 'Merge one branch into another.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, sourceBranchId: { type: 'string' }, targetBranchId: { type: 'string' } }, required: ['projectId', 'sourceBranchId', 'targetBranchId'] } },
        { name: 'promote_branch', description: 'Promote branch to primary.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'set_branch_retention', description: 'Configure branch retention policies.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, retentionDays: { type: 'number' } }, required: ['projectId', 'branchId', 'retentionDays'] } },
        { name: 'get_branch_history', description: 'Get branch creation/modification history.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'restore_branch_to_timestamp', description: 'Point-in-time recovery for branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, timestamp: { type: 'string' } }, required: ['projectId', 'branchId', 'timestamp'] } },
        { name: 'get_branch_size', description: 'Get storage size of branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'set_branch_compute_settings', description: 'Configure compute for specific branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, settings: { type: 'object' } }, required: ['projectId', 'branchId', 'settings'] } },
        { name: 'get_branch_connections', description: 'List active connections to branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'list_branch_computes', description: 'List compute endpoints for branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId'] } },

        // SQL EXECUTION (10 tools)
        { name: 'run_sql', description: 'Execute a single SQL statement.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, sql: { type: 'string' } }, required: ['projectId', 'sql'] } },
        { name: 'run_sql_transaction', description: 'Execute multiple SQL statements in a transaction.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, sqlStatements: { type: 'array', items: { type: 'string' } } }, required: ['projectId', 'sqlStatements'] } },
        { name: 'get_connection_string', description: 'Get PostgreSQL connection string.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, roleName: { type: 'string' }, computeId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'get_database_tables', description: 'List all tables in database.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'describe_table_schema', description: 'Get table schema definition.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, tableName: { type: 'string' } }, required: ['projectId', 'tableName'] } },
        { name: 'explain_sql_statement', description: 'Get query execution plan.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, sql: { type: 'string' }, analyze: { type: 'boolean' } }, required: ['projectId', 'sql'] } },
        { name: 'list_slow_queries', description: 'Find slow queries using pg_stat_statements.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, computeId: { type: 'string' }, limit: { type: 'number' }, minExecutionTime: { type: 'number' } }, required: ['projectId'] } },
        { name: 'optimize_query', description: 'AI-powered query optimization.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, sql: { type: 'string' } }, required: ['projectId', 'sql'] } },
        { name: 'suggest_indexes', description: 'Intelligent index suggestions.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, tableName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'analyze_query_plan', description: 'Deep query plan analysis.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, sql: { type: 'string' } }, required: ['projectId', 'sql'] } },

        // DATABASE MANAGEMENT (12 tools)
        { name: 'create_database', description: 'Create new database.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, owner: { type: 'string' } }, required: ['projectId', 'databaseName'] } },
        { name: 'delete_database', description: 'Delete database.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'databaseName'] } },
        { name: 'list_databases', description: 'List all databases.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'get_database_size', description: 'Get database storage size.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'databaseName'] } },
        { name: 'get_database_stats', description: 'Get database statistics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'databaseName'] } },
        { name: 'vacuum_database', description: 'Run VACUUM on database.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, full: { type: 'boolean' }, analyze: { type: 'boolean' } }, required: ['projectId', 'databaseName'] } },
        { name: 'analyze_database', description: 'Run ANALYZE on database.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'databaseName'] } },
        { name: 'reindex_database', description: 'Reindex database.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'databaseName'] } },
        { name: 'get_database_locks', description: 'View current locks.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'databaseName'] } },
        { name: 'kill_database_query', description: 'Terminate running query.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, pid: { type: 'number' } }, required: ['projectId', 'databaseName', 'pid'] } },
        { name: 'get_database_activity', description: 'View current database activity.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'databaseName'] } },
        { name: 'backup_database', description: 'Create manual backup.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'databaseName'] } },

        // MIGRATIONS (2 tools)
        { name: 'prepare_database_migration', description: 'Prepare database migration in temporary branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, databaseName: { type: 'string' }, migrationSql: { type: 'string' } }, required: ['projectId', 'migrationSql'] } },
        { name: 'complete_database_migration', description: 'Complete and apply migration to main branch.', inputSchema: { type: 'object', properties: { migrationId: { type: 'string' } }, required: ['migrationId'] } },

        // QUERY TUNING (2 tools)
        { name: 'prepare_query_tuning', description: 'Analyze and prepare query optimizations.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, databaseName: { type: 'string' }, sql: { type: 'string' }, roleName: { type: 'string' } }, required: ['projectId', 'databaseName', 'sql'] } },
        { name: 'complete_query_tuning', description: 'Apply or discard query optimizations.', inputSchema: { type: 'object', properties: { tuningId: { type: 'string' }, projectId: { type: 'string' }, databaseName: { type: 'string' }, temporaryBranchId: { type: 'string' }, suggestedSqlStatements: { type: 'array', items: { type: 'string' } }, applyChanges: { type: 'boolean' }, branchId: { type: 'string' }, roleName: { type: 'string' }, shouldDeleteTemporaryBranch: { type: 'boolean' } }, required: ['tuningId', 'projectId', 'databaseName', 'temporaryBranchId', 'suggestedSqlStatements'] } },

        // ROLE MANAGEMENT (8 tools)
        { name: 'create_role', description: 'Create database role.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, roleName: { type: 'string' }, password: { type: 'string' } }, required: ['projectId', 'roleName'] } },
        { name: 'delete_role', description: 'Delete database role.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, roleName: { type: 'string' } }, required: ['projectId', 'roleName'] } },
        { name: 'list_roles', description: 'List all roles.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'update_role', description: 'Update role permissions.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, roleName: { type: 'string' }, permissions: { type: 'object' } }, required: ['projectId', 'roleName'] } },
        { name: 'grant_role_permissions', description: 'Grant specific permissions.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, roleName: { type: 'string' }, permissions: { type: 'array' } }, required: ['projectId', 'roleName', 'permissions'] } },
        { name: 'revoke_role_permissions', description: 'Revoke permissions.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, roleName: { type: 'string' }, permissions: { type: 'array' } }, required: ['projectId', 'roleName', 'permissions'] } },
        { name: 'get_role_permissions', description: 'List role permissions.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, roleName: { type: 'string' } }, required: ['projectId', 'roleName'] } },
        { name: 'reset_role_password', description: 'Reset role password.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, roleName: { type: 'string' }, password: { type: 'string' } }, required: ['projectId', 'roleName', 'password'] } },

        // COMPUTE/ENDPOINT MANAGEMENT (10 tools)
        { name: 'create_endpoint', description: 'Create compute endpoint.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, type: { type: 'string' }, settings: { type: 'object' } }, required: ['projectId', 'branchId', 'type'] } },
        { name: 'delete_endpoint', description: 'Delete endpoint.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' } }, required: ['projectId', 'endpointId'] } },
        { name: 'update_endpoint', description: 'Update endpoint settings.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' }, settings: { type: 'object' } }, required: ['projectId', 'endpointId', 'settings'] } },
        { name: 'start_endpoint', description: 'Start suspended endpoint.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' } }, required: ['projectId', 'endpointId'] } },
        { name: 'suspend_endpoint', description: 'Suspend endpoint.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' } }, required: ['projectId', 'endpointId'] } },
        { name: 'restart_endpoint', description: 'Restart endpoint.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' } }, required: ['projectId', 'endpointId'] } },
        { name: 'get_endpoint_metrics', description: 'Get endpoint performance metrics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' } }, required: ['projectId', 'endpointId'] } },
        { name: 'set_endpoint_autoscaling', description: 'Configure autoscaling.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' }, minCu: { type: 'number' }, maxCu: { type: 'number' } }, required: ['projectId', 'endpointId'] } },
        { name: 'get_endpoint_logs', description: 'Retrieve endpoint logs.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' }, limit: { type: 'number' } }, required: ['projectId', 'endpointId'] } },
        { name: 'set_endpoint_pooling', description: 'Configure connection pooling.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' }, poolMode: { type: 'string' }, poolSize: { type: 'number' } }, required: ['projectId', 'endpointId'] } },

        // MONITORING & ANALYTICS (15 tools)
        { name: 'get_query_statistics', description: 'Get query performance stats.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, limit: { type: 'number' } }, required: ['projectId'] } },
        { name: 'get_slow_query_log', description: 'Enhanced slow query analysis.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, minDuration: { type: 'number' } }, required: ['projectId'] } },
        { name: 'get_connection_stats', description: 'Connection pool statistics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'get_storage_metrics', description: 'Storage usage over time.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' } }, required: ['projectId'] } },
        { name: 'get_compute_metrics', description: 'Compute usage over time.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' } }, required: ['projectId'] } },
        { name: 'get_io_metrics', description: 'I/O performance metrics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'get_cache_hit_ratio', description: 'Cache performance metrics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'get_index_usage', description: 'Index usage statistics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, tableName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'get_table_bloat', description: 'Identify bloated tables.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'get_replication_lag', description: 'Check replication status.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'get_checkpoint_stats', description: 'Checkpoint statistics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'get_wal_stats', description: 'WAL statistics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'set_monitoring_alerts', description: 'Configure alerts.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, alertType: { type: 'string' }, threshold: { type: 'number' }, email: { type: 'string' } }, required: ['projectId', 'alertType', 'threshold'] } },
        { name: 'get_alert_history', description: 'View alert history.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, limit: { type: 'number' } }, required: ['projectId'] } },
        { name: 'get_performance_insights', description: 'AI-powered performance recommendations.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },

        // BACKUP & RECOVERY (8 tools)
        { name: 'list_backups', description: 'List available backups.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'create_backup', description: 'Create manual backup.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, name: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'restore_backup', description: 'Restore from backup.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, backupId: { type: 'string' }, targetBranchId: { type: 'string' } }, required: ['projectId', 'backupId'] } },
        { name: 'delete_backup', description: 'Delete backup.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, backupId: { type: 'string' } }, required: ['projectId', 'backupId'] } },
        { name: 'get_backup_status', description: 'Check backup status.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, backupId: { type: 'string' } }, required: ['projectId', 'backupId'] } },
        { name: 'schedule_backup', description: 'Schedule automated backups.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, schedule: { type: 'string' } }, required: ['projectId', 'branchId', 'schedule'] } },
        { name: 'export_backup', description: 'Export backup to external storage.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, backupId: { type: 'string' }, destination: { type: 'string' } }, required: ['projectId', 'backupId', 'destination'] } },
        { name: 'validate_backup', description: 'Verify backup integrity.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, backupId: { type: 'string' } }, required: ['projectId', 'backupId'] } },

        // SECURITY & COMPLIANCE (10 tools)
        { name: 'enable_ip_allowlist', description: 'Configure IP allowlist.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, ipAddresses: { type: 'array', items: { type: 'string' } } }, required: ['projectId', 'ipAddresses'] } },
        { name: 'get_ip_allowlist', description: 'View IP allowlist.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'enable_ssl_enforcement', description: 'Enforce SSL connections.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, enforce: { type: 'boolean' } }, required: ['projectId', 'enforce'] } },
        { name: 'rotate_credentials', description: 'Rotate database credentials.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, roleName: { type: 'string' } }, required: ['projectId', 'roleName'] } },
        { name: 'get_audit_log', description: 'Retrieve audit logs.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' }, limit: { type: 'number' } }, required: ['projectId'] } },
        { name: 'enable_encryption', description: 'Configure encryption settings.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, encryptionType: { type: 'string' } }, required: ['projectId', 'encryptionType'] } },
        { name: 'get_security_scan', description: 'Run security vulnerability scan.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'set_password_policy', description: 'Configure password policies.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, policy: { type: 'object' } }, required: ['projectId', 'policy'] } },
        { name: 'enable_2fa', description: 'Enable two-factor authentication.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, enabled: { type: 'boolean' } }, required: ['projectId', 'enabled'] } },
        { name: 'get_compliance_report', description: 'Generate compliance reports.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, reportType: { type: 'string' } }, required: ['projectId', 'reportType'] } },

        // COST MANAGEMENT (8 tools)
        { name: 'get_cost_breakdown', description: 'Detailed cost analysis.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' } }, required: ['projectId'] } },
        { name: 'get_cost_forecast', description: 'Predict future costs.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, days: { type: 'number' } }, required: ['projectId'] } },
        { name: 'set_cost_alerts', description: 'Configure cost alerts.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, threshold: { type: 'number' }, email: { type: 'string' } }, required: ['projectId', 'threshold'] } },
        { name: 'get_cost_optimization_tips', description: 'AI-powered cost optimization.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'get_billing_history', description: 'View billing history.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, months: { type: 'number' } }, required: ['projectId'] } },
        { name: 'export_cost_report', description: 'Export cost reports.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, format: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' } }, required: ['projectId', 'format'] } },
        { name: 'set_budget_limits', description: 'Configure budget limits.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, monthlyLimit: { type: 'number' } }, required: ['projectId', 'monthlyLimit'] } },
        { name: 'get_resource_recommendations', description: 'Right-sizing recommendations.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },

        // INTEGRATION & WEBHOOKS (6 tools)
        { name: 'create_webhook', description: 'Create webhook for events.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, url: { type: 'string' }, events: { type: 'array', items: { type: 'string' } } }, required: ['projectId', 'url', 'events'] } },
        { name: 'list_webhooks', description: 'List configured webhooks.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'delete_webhook', description: 'Delete webhook.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, webhookId: { type: 'string' } }, required: ['projectId', 'webhookId'] } },
        { name: 'test_webhook', description: 'Test webhook delivery.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, webhookId: { type: 'string' } }, required: ['projectId', 'webhookId'] } },
        { name: 'get_webhook_logs', description: 'View webhook delivery logs.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, webhookId: { type: 'string' }, limit: { type: 'number' } }, required: ['projectId', 'webhookId'] } },
        { name: 'create_api_key', description: 'Generate API keys.', inputSchema: { type: 'object', properties: { name: { type: 'string' }, scopes: { type: 'array', items: { type: 'string' } } }, required: ['name'] } },

        // ADVANCED SQL TOOLS (10 tools)
        { name: 'detect_n_plus_one', description: 'Detect N+1 query problems.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'suggest_partitioning', description: 'Table partitioning recommendations.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, tableName: { type: 'string' } }, required: ['projectId', 'tableName'] } },
        { name: 'analyze_table_statistics', description: 'Detailed table statistics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, tableName: { type: 'string' } }, required: ['projectId', 'tableName'] } },
        { name: 'suggest_vacuum_strategy', description: 'VACUUM optimization.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'detect_missing_indexes', description: 'Find missing indexes.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'analyze_join_performance', description: 'Join optimization analysis.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, sql: { type: 'string' } }, required: ['projectId', 'sql'] } },
        { name: 'suggest_materialized_views', description: 'Materialized view recommendations.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'get_table_dependencies', description: 'Analyze table dependencies.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, tableName: { type: 'string' } }, required: ['projectId', 'tableName'] } },
        { name: 'suggest_query_rewrite', description: 'Query rewrite suggestions.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, sql: { type: 'string' } }, required: ['projectId', 'sql'] } },
        { name: 'analyze_deadlocks', description: 'Deadlock analysis and prevention.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },

        // NEON AUTH (1 tool)
        { name: 'provision_neon_auth', description: 'Provision Neon Auth with Stack Auth integration.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, database: { type: 'string' } }, required: ['projectId'] } },

        // API KEY MANAGEMENT (3 tools)
        { name: 'list_api_keys', description: 'List all API keys for the account.', inputSchema: { type: 'object', properties: {} } },
        { name: 'create_api_key_for_project', description: 'Create project-specific API key.', inputSchema: { type: 'object', properties: { keyName: { type: 'string' }, projectId: { type: 'string' } }, required: ['keyName'] } },
        { name: 'revoke_api_key', description: 'Revoke/delete API key.', inputSchema: { type: 'object', properties: { keyId: { type: 'string' } }, required: ['keyId'] } },

        // CONNECTION POOLING (2 tools)
        { name: 'get_connection_pooler_config', description: 'Get connection pooler configuration.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' } }, required: ['projectId', 'endpointId'] } },
        { name: 'update_connection_pooler_config', description: 'Update pooler settings (PgBouncer).', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' }, poolMode: { type: 'string' }, poolSize: { type: 'number' }, maxClientConn: { type: 'number' } }, required: ['projectId', 'endpointId'] } },

        // READ REPLICAS (2 tools)
        { name: 'create_read_replica', description: 'Create read replica endpoint.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, region: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'list_read_replicas', description: 'List all read replicas for a branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId', 'branchId'] } },

        // PROJECT SHARING & COLLABORATION (3 tools)
        { name: 'share_project', description: 'Share project with another user.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, email: { type: 'string' }, role: { type: 'string' } }, required: ['projectId', 'email'] } },
        { name: 'list_project_shares', description: 'List all project shares.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'revoke_project_share', description: 'Remove project access.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, shareId: { type: 'string' } }, required: ['projectId', 'shareId'] } }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const args = request.params.arguments as any;

      try {
        switch (request.params.name) {
          // PROJECT MANAGEMENT
          case 'list_projects': return await this.listProjects(args);
          case 'list_organizations': return await this.listOrganizations(args);
          case 'list_shared_projects': return await this.listSharedProjects(args);
          case 'create_project': return await this.createProject(args);
          case 'delete_project': return await this.deleteProject(args);
          case 'describe_project': return await this.describeProject(args);
          case 'update_project': return await this.updateProject(args);
          case 'get_project_operations': return await this.getProjectOperations(args);
          case 'get_project_consumption': return await this.getProjectConsumption(args);
          case 'set_project_settings': return await this.setProjectSettings(args);
          case 'get_project_quotas': return await this.getProjectQuotas(args);
          case 'clone_project': return await this.cloneProject(args);
          case 'get_project_permissions': return await this.getProjectPermissions(args);

          // BRANCH MANAGEMENT
          case 'create_branch': return await this.createBranch(args);
          case 'delete_branch': return await this.deleteBranch(args);
          case 'describe_branch': return await this.describeBranch(args);
          case 'reset_from_parent': return await this.resetFromParent(args);
          case 'update_branch': return await this.updateBranch(args);
          case 'list_branches': return await this.listBranches(args);
          case 'get_branch_details': return await this.getBranchDetails(args);
          case 'restore_branch': return await this.restoreBranch(args);
          case 'set_branch_protection': return await this.setBranchProtection(args);
          case 'get_branch_schema_diff': return await this.getBranchSchemaDiff(args);
          case 'get_branch_data_diff': return await this.getBranchDataDiff(args);
          case 'merge_branches': return await this.mergeBranches(args);
          case 'promote_branch': return await this.promoteBranch(args);
          case 'set_branch_retention': return await this.setBranchRetention(args);
          case 'get_branch_history': return await this.getBranchHistory(args);
          case 'restore_branch_to_timestamp': return await this.restoreBranchToTimestamp(args);
          case 'get_branch_size': return await this.getBranchSize(args);
          case 'set_branch_compute_settings': return await this.setBranchComputeSettings(args);
          case 'get_branch_connections': return await this.getBranchConnections(args);
          case 'list_branch_computes': return await this.listBranchComputes(args);

          // SQL EXECUTION
          case 'run_sql': return await this.runSql(args);
          case 'run_sql_transaction': return await this.runSqlTransaction(args);
          case 'get_connection_string': return await this.getConnectionString(args);
          case 'get_database_tables': return await this.getDatabaseTables(args);
          case 'describe_table_schema': return await this.describeTableSchema(args);
          case 'explain_sql_statement': return await this.explainSqlStatement(args);
          case 'list_slow_queries': return await this.listSlowQueries(args);
          case 'optimize_query': return await this.optimizeQuery(args);
          case 'suggest_indexes': return await this.suggestIndexes(args);
          case 'analyze_query_plan': return await this.analyzeQueryPlan(args);

          // DATABASE MANAGEMENT
          case 'create_database': return await this.createDatabase(args);
          case 'delete_database': return await this.deleteDatabase(args);
          case 'list_databases': return await this.listDatabases(args);
          case 'get_database_size': return await this.getDatabaseSize(args);
          case 'get_database_stats': return await this.getDatabaseStats(args);
          case 'vacuum_database': return await this.vacuumDatabase(args);
          case 'analyze_database': return await this.analyzeDatabase(args);
          case 'reindex_database': return await this.reindexDatabase(args);
          case 'get_database_locks': return await this.getDatabaseLocks(args);
          case 'kill_database_query': return await this.killDatabaseQuery(args);
          case 'get_database_activity': return await this.getDatabaseActivity(args);
          case 'backup_database': return await this.backupDatabase(args);

          // MIGRATIONS
          case 'prepare_database_migration': return await this.prepareDatabaseMigration(args);
          case 'complete_database_migration': return await this.completeDatabaseMigration(args);

          // QUERY TUNING
          case 'prepare_query_tuning': return await this.prepareQueryTuning(args);
          case 'complete_query_tuning': return await this.completeQueryTuning(args);

          // ROLE MANAGEMENT
          case 'create_role': return await this.createRole(args);
          case 'delete_role': return await this.deleteRole(args);
          case 'list_roles': return await this.listRoles(args);
          case 'update_role': return await this.updateRole(args);
          case 'grant_role_permissions': return await this.grantRolePermissions(args);
          case 'revoke_role_permissions': return await this.revokeRolePermissions(args);
          case 'get_role_permissions': return await this.getRolePermissions(args);
          case 'reset_role_password': return await this.resetRolePassword(args);

          // COMPUTE/ENDPOINT MANAGEMENT
          case 'create_endpoint': return await this.createEndpoint(args);
          case 'delete_endpoint': return await this.deleteEndpoint(args);
          case 'update_endpoint': return await this.updateEndpoint(args);
          case 'start_endpoint': return await this.startEndpoint(args);
          case 'suspend_endpoint': return await this.suspendEndpoint(args);
          case 'restart_endpoint': return await this.restartEndpoint(args);
          case 'get_endpoint_metrics': return await this.getEndpointMetrics(args);
          case 'set_endpoint_autoscaling': return await this.setEndpointAutoscaling(args);
          case 'get_endpoint_logs': return await this.getEndpointLogs(args);
          case 'set_endpoint_pooling': return await this.setEndpointPooling(args);

          // MONITORING & ANALYTICS
          case 'get_query_statistics': return await this.getQueryStatistics(args);
          case 'get_slow_query_log': return await this.getSlowQueryLog(args);
          case 'get_connection_stats': return await this.getConnectionStats(args);
          case 'get_storage_metrics': return await this.getStorageMetrics(args);
          case 'get_compute_metrics': return await this.getComputeMetrics(args);
          case 'get_io_metrics': return await this.getIoMetrics(args);
          case 'get_cache_hit_ratio': return await this.getCacheHitRatio(args);
          case 'get_index_usage': return await this.getIndexUsage(args);
          case 'get_table_bloat': return await this.getTableBloat(args);
          case 'get_replication_lag': return await this.getReplicationLag(args);
          case 'get_checkpoint_stats': return await this.getCheckpointStats(args);
          case 'get_wal_stats': return await this.getWalStats(args);
          case 'set_monitoring_alerts': return await this.setMonitoringAlerts(args);
          case 'get_alert_history': return await this.getAlertHistory(args);
          case 'get_performance_insights': return await this.getPerformanceInsights(args);

          // BACKUP & RECOVERY
          case 'list_backups': return await this.listBackups(args);
          case 'create_backup': return await this.createBackup(args);
          case 'restore_backup': return await this.restoreBackup(args);
          case 'delete_backup': return await this.deleteBackup(args);
          case 'get_backup_status': return await this.getBackupStatus(args);
          case 'schedule_backup': return await this.scheduleBackup(args);
          case 'export_backup': return await this.exportBackup(args);
          case 'validate_backup': return await this.validateBackup(args);

          // SECURITY & COMPLIANCE
          case 'enable_ip_allowlist': return await this.enableIpAllowlist(args);
          case 'get_ip_allowlist': return await this.getIpAllowlist(args);
          case 'enable_ssl_enforcement': return await this.enableSslEnforcement(args);
          case 'rotate_credentials': return await this.rotateCredentials(args);
          case 'get_audit_log': return await this.getAuditLog(args);
          case 'enable_encryption': return await this.enableEncryption(args);
          case 'get_security_scan': return await this.getSecurityScan(args);
          case 'set_password_policy': return await this.setPasswordPolicy(args);
          case 'enable_2fa': return await this.enable2fa(args);
          case 'get_compliance_report': return await this.getComplianceReport(args);

          // COST MANAGEMENT
          case 'get_cost_breakdown': return await this.getCostBreakdown(args);
          case 'get_cost_forecast': return await this.getCostForecast(args);
          case 'set_cost_alerts': return await this.setCostAlerts(args);
          case 'get_cost_optimization_tips': return await this.getCostOptimizationTips(args);
          case 'get_billing_history': return await this.getBillingHistory(args);
          case 'export_cost_report': return await this.exportCostReport(args);
          case 'set_budget_limits': return await this.setBudgetLimits(args);
          case 'get_resource_recommendations': return await this.getResourceRecommendations(args);

          // INTEGRATION & WEBHOOKS
          case 'create_webhook': return await this.createWebhook(args);
          case 'list_webhooks': return await this.listWebhooks(args);
          case 'delete_webhook': return await this.deleteWebhook(args);
          case 'test_webhook': return await this.testWebhook(args);
          case 'get_webhook_logs': return await this.getWebhookLogs(args);
          case 'create_api_key': return await this.createApiKey(args);

          // ADVANCED SQL TOOLS
          case 'detect_n_plus_one': return await this.detectNPlusOne(args);
          case 'suggest_partitioning': return await this.suggestPartitioning(args);
          case 'analyze_table_statistics': return await this.analyzeTableStatistics(args);
          case 'suggest_vacuum_strategy': return await this.suggestVacuumStrategy(args);
          case 'detect_missing_indexes': return await this.detectMissingIndexes(args);
          case 'analyze_join_performance': return await this.analyzeJoinPerformance(args);
          case 'suggest_materialized_views': return await this.suggestMaterializedViews(args);
          case 'get_table_dependencies': return await this.getTableDependencies(args);
          case 'suggest_query_rewrite': return await this.suggestQueryRewrite(args);
          case 'analyze_deadlocks': return await this.analyzeDeadlocks(args);

          // NEON AUTH
          case 'provision_neon_auth': return await this.provisionNeonAuth(args);

          // API KEY MANAGEMENT
          case 'list_api_keys': return await this.listApiKeys(args);
          case 'create_api_key_for_project': return await this.createApiKeyForProject(args);
          case 'revoke_api_key': return await this.revokeApiKey(args);

          // CONNECTION POOLING
          case 'get_connection_pooler_config': return await this.getConnectionPoolerConfig(args);
          case 'update_connection_pooler_config': return await this.updateConnectionPoolerConfig(args);

          // READ REPLICAS
          case 'create_read_replica': return await this.createReadReplica(args);
          case 'list_read_replicas': return await this.listReadReplicas(args);

          // PROJECT SHARING & COLLABORATION
          case 'share_project': return await this.shareProject(args);
          case 'list_project_shares': return await this.listProjectShares(args);
          case 'revoke_project_share': return await this.revokeProjectShare(args);

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message || 'Unknown error occurred'}`
          }]
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('@robinsonai/neon-mcp server running on stdio');
  }

  // PROJECT MANAGEMENT METHODS
  private async listProjects(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.search) params.append('search', args.search);
    if (args.cursor) params.append('cursor', args.cursor);
    if (args.org_id) params.append('org_id', args.org_id);

    const response = await this.client.get(`/projects?${params.toString()}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async listOrganizations(args: any) {
    const response = await this.client.get('/users/me/organizations');
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

  private async listSharedProjects(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.search) params.append('search', args.search);
    if (args.cursor) params.append('cursor', args.cursor);

    const response = await this.client.get(`/projects/shared?${params.toString()}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async createProject(args: any) {
    const body: any = {};
    if (args.name) body.project = { name: args.name };
    if (args.org_id) body.project = { ...body.project, org_id: args.org_id };
    if (args.region_id) body.project = { ...body.project, region_id: args.region_id };
    if (args.pg_version) body.project = { ...body.project, pg_version: args.pg_version };

    const response = await this.client.post('/projects', body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async deleteProject(args: any) {
    const response = await this.client.delete(`/projects/${args.projectId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async describeProject(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async updateProject(args: any) {
    const body: any = { project: {} };
    if (args.name) body.project.name = args.name;
    if (args.settings) body.project.settings = args.settings;

    const response = await this.client.patch(`/projects/${args.projectId}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async getProjectOperations(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append('limit', args.limit.toString());

    const response = await this.client.get(`/projects/${args.projectId}/operations?${params.toString()}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async getProjectConsumption(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);

    const response = await this.client.get(`/projects/${args.projectId}/consumption?${params.toString()}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async setProjectSettings(args: any) {
    const response = await this.client.patch(`/projects/${args.projectId}`, { project: { settings: args.settings } });
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async getProjectQuotas(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}`);
    const quotas = response.data.project?.quotas || {};
    return { content: [{ type: 'text', text: JSON.stringify(quotas, null, 2) }] };
  }

  private async cloneProject(args: any) {
    return { content: [{ type: 'text', text: 'Project cloning: Create new project and copy branches using create_project and create_branch tools.' }] };
  }

  private async getProjectPermissions(args: any) {
    return { content: [{ type: 'text', text: 'Project permissions: Use organization API to manage project access.' }] };
  }

  // BRANCH MANAGEMENT METHODS
  private async createBranch(args: any) {
    const body: any = { branch: {} };
    if (args.branchName) body.branch.name = args.branchName;
    if (args.parent_id) body.branch.parent_id = args.parent_id;

    const response = await this.client.post(`/projects/${args.projectId}/branches`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async deleteBranch(args: any) {
    const response = await this.client.delete(`/projects/${args.projectId}/branches/${args.branchId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async describeBranch(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/branches/${args.branchId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async resetFromParent(args: any) {
    const body: any = {};
    if (args.preserveUnderName) body.preserve_under_name = args.preserveUnderName;

    const response = await this.client.post(`/projects/${args.projectId}/branches/${args.branchIdOrName}/reset`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async updateBranch(args: any) {
    const body: any = { branch: {} };
    if (args.name) body.branch.name = args.name;
    if (args.protected !== undefined) body.branch.protected = args.protected;

    const response = await this.client.patch(`/projects/${args.projectId}/branches/${args.branchId}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async listBranches(args: any) {
    const params = new URLSearchParams();
    if (args.search) params.append('search', args.search);

    const response = await this.client.get(`/projects/${args.projectId}/branches?${params.toString()}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async getBranchDetails(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/branches/${args.branchId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async restoreBranch(args: any) {
    return { content: [{ type: 'text', text: 'Branch restore: Use create_branch with parent_timestamp to restore to specific point in time.' }] };
  }

  private async setBranchProtection(args: any) {
    const response = await this.client.patch(`/projects/${args.projectId}/branches/${args.branchId}`, {
      branch: { protected: args.protected }
    });
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async getBranchSchemaDiff(args: any) {
    return { content: [{ type: 'text', text: 'Schema diff: Use run_sql to query information_schema on both branches and compare.' }] };
  }

  private async getBranchDataDiff(args: any) {
    return { content: [{ type: 'text', text: 'Data diff: Use run_sql to query and compare data between branches.' }] };
  }

  private async mergeBranches(args: any) {
    return { content: [{ type: 'text', text: 'Branch merge: Use prepare_database_migration to apply changes from source to target branch.' }] };
  }

  private async promoteBranch(args: any) {
    const response = await this.client.post(`/projects/${args.projectId}/branches/${args.branchId}/set_as_primary`, {});
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async setBranchRetention(args: any) {
    return { content: [{ type: 'text', text: 'Branch retention: Configure via project settings.' }] };
  }

  private async getBranchHistory(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/branches/${args.branchId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async restoreBranchToTimestamp(args: any) {
    const body = { timestamp: args.timestamp };
    const response = await this.client.post(`/projects/${args.projectId}/branches/${args.branchId}/restore`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async getBranchSize(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/branches/${args.branchId}`);
    const size = response.data.branch?.logical_size || 0;
    return { content: [{ type: 'text', text: `Branch size: ${size} bytes` }] };
  }

  private async setBranchComputeSettings(args: any) {
    return { content: [{ type: 'text', text: 'Compute settings: Use update_endpoint to configure compute for branch endpoints.' }] };
  }

  private async getBranchConnections(args: any) {
    return { content: [{ type: 'text', text: 'Active connections: Use run_sql with "SELECT * FROM pg_stat_activity" to view connections.' }] };
  }

  private async listBranchComputes(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/endpoints`);
    const branchEndpoints = args.branchId
      ? response.data.endpoints?.filter((e: any) => e.branch_id === args.branchId)
      : response.data.endpoints;
    return { content: [{ type: 'text', text: JSON.stringify(branchEndpoints, null, 2) }] };
  }

  // Placeholder methods - will implement in batches
  private async runSql(args: any) { return { content: [{ type: 'text', text: 'SQL execution: Not yet implemented' }] }; }
  private async runSqlTransaction(args: any) { return { content: [{ type: 'text', text: 'SQL transaction: Not yet implemented' }] }; }
  private async getConnectionString(args: any) { return { content: [{ type: 'text', text: 'Connection string: Not yet implemented' }] }; }
  private async getDatabaseTables(args: any) { return { content: [{ type: 'text', text: 'Database tables: Not yet implemented' }] }; }
  private async describeTableSchema(args: any) { return { content: [{ type: 'text', text: 'Table schema: Not yet implemented' }] }; }
  private async explainSqlStatement(args: any) { return { content: [{ type: 'text', text: 'Explain SQL: Not yet implemented' }] }; }
  private async listSlowQueries(args: any) { return { content: [{ type: 'text', text: 'Slow queries: Not yet implemented' }] }; }
  private async optimizeQuery(args: any) { return { content: [{ type: 'text', text: 'Query optimization: Not yet implemented' }] }; }
  private async suggestIndexes(args: any) { return { content: [{ type: 'text', text: 'Index suggestions: Not yet implemented' }] }; }
  private async analyzeQueryPlan(args: any) { return { content: [{ type: 'text', text: 'Query plan analysis: Not yet implemented' }] }; }
  private async createDatabase(args: any) { return { content: [{ type: 'text', text: 'Create database: Not yet implemented' }] }; }
  private async deleteDatabase(args: any) { return { content: [{ type: 'text', text: 'Delete database: Not yet implemented' }] }; }
  private async listDatabases(args: any) { return { content: [{ type: 'text', text: 'List databases: Not yet implemented' }] }; }
  private async getDatabaseSize(args: any) { return { content: [{ type: 'text', text: 'Database size: Not yet implemented' }] }; }
  private async getDatabaseStats(args: any) { return { content: [{ type: 'text', text: 'Database stats: Not yet implemented' }] }; }
  private async vacuumDatabase(args: any) { return { content: [{ type: 'text', text: 'Vacuum database: Not yet implemented' }] }; }
  private async analyzeDatabase(args: any) { return { content: [{ type: 'text', text: 'Analyze database: Not yet implemented' }] }; }
  private async reindexDatabase(args: any) { return { content: [{ type: 'text', text: 'Reindex database: Not yet implemented' }] }; }
  private async getDatabaseLocks(args: any) { return { content: [{ type: 'text', text: 'Database locks: Not yet implemented' }] }; }
  private async killDatabaseQuery(args: any) { return { content: [{ type: 'text', text: 'Kill query: Not yet implemented' }] }; }
  private async getDatabaseActivity(args: any) { return { content: [{ type: 'text', text: 'Database activity: Not yet implemented' }] }; }
  private async backupDatabase(args: any) { return { content: [{ type: 'text', text: 'Backup database: Not yet implemented' }] }; }
  private async prepareDatabaseMigration(args: any) { return { content: [{ type: 'text', text: 'Prepare migration: Not yet implemented' }] }; }
  private async completeDatabaseMigration(args: any) { return { content: [{ type: 'text', text: 'Complete migration: Not yet implemented' }] }; }
  private async prepareQueryTuning(args: any) { return { content: [{ type: 'text', text: 'Prepare query tuning: Not yet implemented' }] }; }
  private async completeQueryTuning(args: any) { return { content: [{ type: 'text', text: 'Complete query tuning: Not yet implemented' }] }; }
  private async createRole(args: any) { return { content: [{ type: 'text', text: 'Create role: Not yet implemented' }] }; }
  private async deleteRole(args: any) { return { content: [{ type: 'text', text: 'Delete role: Not yet implemented' }] }; }
  private async listRoles(args: any) { return { content: [{ type: 'text', text: 'List roles: Not yet implemented' }] }; }
  private async updateRole(args: any) { return { content: [{ type: 'text', text: 'Update role: Not yet implemented' }] }; }
  private async grantRolePermissions(args: any) { return { content: [{ type: 'text', text: 'Grant permissions: Not yet implemented' }] }; }
  private async revokeRolePermissions(args: any) { return { content: [{ type: 'text', text: 'Revoke permissions: Not yet implemented' }] }; }
  private async getRolePermissions(args: any) { return { content: [{ type: 'text', text: 'Get permissions: Not yet implemented' }] }; }
  private async resetRolePassword(args: any) { return { content: [{ type: 'text', text: 'Reset password: Not yet implemented' }] }; }
  private async createEndpoint(args: any) { return { content: [{ type: 'text', text: 'Create endpoint: Not yet implemented' }] }; }
  private async deleteEndpoint(args: any) { return { content: [{ type: 'text', text: 'Delete endpoint: Not yet implemented' }] }; }
  private async updateEndpoint(args: any) { return { content: [{ type: 'text', text: 'Update endpoint: Not yet implemented' }] }; }
  private async startEndpoint(args: any) { return { content: [{ type: 'text', text: 'Start endpoint: Not yet implemented' }] }; }
  private async suspendEndpoint(args: any) { return { content: [{ type: 'text', text: 'Suspend endpoint: Not yet implemented' }] }; }
  private async restartEndpoint(args: any) { return { content: [{ type: 'text', text: 'Restart endpoint: Not yet implemented' }] }; }
  private async getEndpointMetrics(args: any) { return { content: [{ type: 'text', text: 'Endpoint metrics: Not yet implemented' }] }; }
  private async setEndpointAutoscaling(args: any) { return { content: [{ type: 'text', text: 'Set autoscaling: Not yet implemented' }] }; }
  private async getEndpointLogs(args: any) { return { content: [{ type: 'text', text: 'Endpoint logs: Not yet implemented' }] }; }
  private async setEndpointPooling(args: any) { return { content: [{ type: 'text', text: 'Set pooling: Not yet implemented' }] }; }
  private async getQueryStatistics(args: any) { return { content: [{ type: 'text', text: 'Query statistics: Not yet implemented' }] }; }
  private async getSlowQueryLog(args: any) { return { content: [{ type: 'text', text: 'Slow query log: Not yet implemented' }] }; }
  private async getConnectionStats(args: any) { return { content: [{ type: 'text', text: 'Connection stats: Not yet implemented' }] }; }
  private async getStorageMetrics(args: any) { return { content: [{ type: 'text', text: 'Storage metrics: Not yet implemented' }] }; }
  private async getComputeMetrics(args: any) { return { content: [{ type: 'text', text: 'Compute metrics: Not yet implemented' }] }; }
  private async getIoMetrics(args: any) { return { content: [{ type: 'text', text: 'I/O metrics: Not yet implemented' }] }; }
  private async getCacheHitRatio(args: any) { return { content: [{ type: 'text', text: 'Cache hit ratio: Not yet implemented' }] }; }
  private async getIndexUsage(args: any) { return { content: [{ type: 'text', text: 'Index usage: Not yet implemented' }] }; }
  private async getTableBloat(args: any) { return { content: [{ type: 'text', text: 'Table bloat: Not yet implemented' }] }; }
  private async getReplicationLag(args: any) { return { content: [{ type: 'text', text: 'Replication lag: Not yet implemented' }] }; }
  private async getCheckpointStats(args: any) { return { content: [{ type: 'text', text: 'Checkpoint stats: Not yet implemented' }] }; }
  private async getWalStats(args: any) { return { content: [{ type: 'text', text: 'WAL stats: Not yet implemented' }] }; }
  private async setMonitoringAlerts(args: any) { return { content: [{ type: 'text', text: 'Set alerts: Not yet implemented' }] }; }
  private async getAlertHistory(args: any) { return { content: [{ type: 'text', text: 'Alert history: Not yet implemented' }] }; }
  private async getPerformanceInsights(args: any) { return { content: [{ type: 'text', text: 'Performance insights: Not yet implemented' }] }; }
  private async listBackups(args: any) { return { content: [{ type: 'text', text: 'List backups: Not yet implemented' }] }; }
  private async createBackup(args: any) { return { content: [{ type: 'text', text: 'Create backup: Not yet implemented' }] }; }
  private async restoreBackup(args: any) { return { content: [{ type: 'text', text: 'Restore backup: Not yet implemented' }] }; }
  private async deleteBackup(args: any) { return { content: [{ type: 'text', text: 'Delete backup: Not yet implemented' }] }; }
  private async getBackupStatus(args: any) { return { content: [{ type: 'text', text: 'Backup status: Not yet implemented' }] }; }
  private async scheduleBackup(args: any) { return { content: [{ type: 'text', text: 'Schedule backup: Not yet implemented' }] }; }
  private async exportBackup(args: any) { return { content: [{ type: 'text', text: 'Export backup: Not yet implemented' }] }; }
  private async validateBackup(args: any) { return { content: [{ type: 'text', text: 'Validate backup: Not yet implemented' }] }; }
  private async enableIpAllowlist(args: any) { return { content: [{ type: 'text', text: 'Enable IP allowlist: Not yet implemented' }] }; }
  private async getIpAllowlist(args: any) { return { content: [{ type: 'text', text: 'Get IP allowlist: Not yet implemented' }] }; }
  private async enableSslEnforcement(args: any) { return { content: [{ type: 'text', text: 'Enable SSL: Not yet implemented' }] }; }
  private async rotateCredentials(args: any) { return { content: [{ type: 'text', text: 'Rotate credentials: Not yet implemented' }] }; }
  private async getAuditLog(args: any) { return { content: [{ type: 'text', text: 'Audit log: Not yet implemented' }] }; }
  private async enableEncryption(args: any) { return { content: [{ type: 'text', text: 'Enable encryption: Not yet implemented' }] }; }
  private async getSecurityScan(args: any) { return { content: [{ type: 'text', text: 'Security scan: Not yet implemented' }] }; }
  private async setPasswordPolicy(args: any) { return { content: [{ type: 'text', text: 'Set password policy: Not yet implemented' }] }; }
  private async enable2fa(args: any) { return { content: [{ type: 'text', text: 'Enable 2FA: Not yet implemented' }] }; }
  private async getComplianceReport(args: any) { return { content: [{ type: 'text', text: 'Compliance report: Not yet implemented' }] }; }
  private async getCostBreakdown(args: any) { return { content: [{ type: 'text', text: 'Cost breakdown: Not yet implemented' }] }; }
  private async getCostForecast(args: any) { return { content: [{ type: 'text', text: 'Cost forecast: Not yet implemented' }] }; }
  private async setCostAlerts(args: any) { return { content: [{ type: 'text', text: 'Set cost alerts: Not yet implemented' }] }; }
  private async getCostOptimizationTips(args: any) { return { content: [{ type: 'text', text: 'Cost optimization: Not yet implemented' }] }; }
  private async getBillingHistory(args: any) { return { content: [{ type: 'text', text: 'Billing history: Not yet implemented' }] }; }
  private async exportCostReport(args: any) { return { content: [{ type: 'text', text: 'Export cost report: Not yet implemented' }] }; }
  private async setBudgetLimits(args: any) { return { content: [{ type: 'text', text: 'Set budget limits: Not yet implemented' }] }; }
  private async getResourceRecommendations(args: any) { return { content: [{ type: 'text', text: 'Resource recommendations: Not yet implemented' }] }; }
  private async createWebhook(args: any) { return { content: [{ type: 'text', text: 'Create webhook: Not yet implemented' }] }; }
  private async listWebhooks(args: any) { return { content: [{ type: 'text', text: 'List webhooks: Not yet implemented' }] }; }
  private async deleteWebhook(args: any) { return { content: [{ type: 'text', text: 'Delete webhook: Not yet implemented' }] }; }
  private async testWebhook(args: any) { return { content: [{ type: 'text', text: 'Test webhook: Not yet implemented' }] }; }
  private async getWebhookLogs(args: any) { return { content: [{ type: 'text', text: 'Webhook logs: Not yet implemented' }] }; }
  private async createApiKey(args: any) { return { content: [{ type: 'text', text: 'Create API key: Not yet implemented' }] }; }
  private async detectNPlusOne(args: any) { return { content: [{ type: 'text', text: 'Detect N+1: Not yet implemented' }] }; }
  private async suggestPartitioning(args: any) { return { content: [{ type: 'text', text: 'Suggest partitioning: Not yet implemented' }] }; }
  private async analyzeTableStatistics(args: any) { return { content: [{ type: 'text', text: 'Table statistics: Not yet implemented' }] }; }
  private async suggestVacuumStrategy(args: any) { return { content: [{ type: 'text', text: 'Vacuum strategy: Not yet implemented' }] }; }
  private async detectMissingIndexes(args: any) { return { content: [{ type: 'text', text: 'Missing indexes: Not yet implemented' }] }; }
  private async analyzeJoinPerformance(args: any) { return { content: [{ type: 'text', text: 'Join performance: Not yet implemented' }] }; }
  private async suggestMaterializedViews(args: any) { return { content: [{ type: 'text', text: 'Materialized views: Not yet implemented' }] }; }
  private async getTableDependencies(args: any) { return { content: [{ type: 'text', text: 'Table dependencies: Not yet implemented' }] }; }
  private async suggestQueryRewrite(args: any) { return { content: [{ type: 'text', text: 'Query rewrite: Not yet implemented' }] }; }
  private async analyzeDeadlocks(args: any) { return { content: [{ type: 'text', text: 'Analyze deadlocks: Not yet implemented' }] }; }
  private async provisionNeonAuth(args: any) { return { content: [{ type: 'text', text: 'Provision Neon Auth: Not yet implemented' }] }; }

  // API KEY MANAGEMENT
  private async listApiKeys(args: any) {
    const response = await this.client.get('/api_keys');
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async createApiKeyForProject(args: any) {
    const body: any = { key_name: args.keyName };
    if (args.projectId) body.project_id = args.projectId;

    const response = await this.client.post('/api_keys', body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async revokeApiKey(args: any) {
    const response = await this.client.delete(`/api_keys/${args.keyId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  // CONNECTION POOLING
  private async getConnectionPoolerConfig(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/endpoints/${args.endpointId}`);
    const poolerConfig = response.data.endpoint?.pooler_enabled ? {
      pooler_enabled: response.data.endpoint.pooler_enabled,
      pooler_mode: response.data.endpoint.pooler_mode,
      settings: response.data.endpoint.settings
    } : { pooler_enabled: false };

    return { content: [{ type: 'text', text: JSON.stringify(poolerConfig, null, 2) }] };
  }

  private async updateConnectionPoolerConfig(args: any) {
    const body: any = { endpoint: {} };
    if (args.poolMode) body.endpoint.pooler_mode = args.poolMode;
    if (args.poolSize !== undefined) body.endpoint.settings = { ...body.endpoint.settings, pool_size: args.poolSize };
    if (args.maxClientConn !== undefined) body.endpoint.settings = { ...body.endpoint.settings, max_client_conn: args.maxClientConn };

    const response = await this.client.patch(`/projects/${args.projectId}/endpoints/${args.endpointId}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  // READ REPLICAS
  private async createReadReplica(args: any) {
    const body: any = {
      endpoint: {
        branch_id: args.branchId,
        type: 'read_only'
      }
    };
    if (args.region) body.endpoint.region_id = args.region;

    const response = await this.client.post(`/projects/${args.projectId}/endpoints`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async listReadReplicas(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/endpoints`);
    const readReplicas = response.data.endpoints?.filter((ep: any) =>
      ep.type === 'read_only' && ep.branch_id === args.branchId
    ) || [];

    return { content: [{ type: 'text', text: JSON.stringify({ read_replicas: readReplicas }, null, 2) }] };
  }

  // PROJECT SHARING & COLLABORATION
  private async shareProject(args: any) {
    const body: any = {
      email: args.email
    };
    if (args.role) body.role = args.role;

    const response = await this.client.post(`/projects/${args.projectId}/permissions`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async listProjectShares(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/permissions`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async revokeProjectShare(args: any) {
    const response = await this.client.delete(`/projects/${args.projectId}/permissions/${args.shareId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }
}

const apiKey = process.argv[2];
if (!apiKey) {
  console.error('Usage: neon-mcp <NEON_API_KEY>');
  process.exit(1);
}

const server = new NeonMCP(apiKey);
server.run().catch(console.error);
