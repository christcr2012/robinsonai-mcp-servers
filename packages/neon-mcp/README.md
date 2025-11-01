# @robinsonai/neon-mcp

Comprehensive Neon PostgreSQL MCP server with **145 tools** for complete database management, monitoring, optimization, and cost control.

## Features

### 🚀 **145 Comprehensive Tools**

#### **Project Management (13 tools)**
- List, create, update, delete projects
- Project consumption metrics
- Project quotas and settings
- Project permissions
- Project cloning

#### **Branch Management (20 tools)**
- Create, delete, update branches
- Branch protection
- Schema and data diff between branches
- Branch merging and promotion
- Point-in-time recovery
- Branch size and connections
- Branch retention policies

#### **SQL Execution (10 tools)**
- Execute single SQL statements
- SQL transactions
- Connection strings
- Table schema inspection
- Query execution plans
- Slow query analysis
- AI-powered query optimization
- Index suggestions

#### **Database Management (12 tools)**
- Create, delete, list databases
- Database size and statistics
- VACUUM, ANALYZE, REINDEX operations
- Database locks and activity
- Query termination
- Manual backups

#### **Migrations & Query Tuning (4 tools)**
- Prepare and complete database migrations
- Prepare and complete query tuning
- Safe testing in temporary branches

#### **Role Management (8 tools)**
- Create, delete, update roles
- Grant and revoke permissions
- Password management
- Role permissions listing

#### **Compute/Endpoint Management (10 tools)**
- Create, delete, update endpoints
- Start, suspend, restart endpoints
- Endpoint metrics and logs
- Autoscaling configuration
- Connection pooling

#### **Monitoring & Analytics (15 tools)**
- Query statistics
- Slow query logs
- Connection statistics
- Storage and compute metrics
- I/O metrics
- Cache hit ratios
- Index usage statistics
- Table bloat detection
- Replication lag
- Checkpoint and WAL statistics
- Monitoring alerts
- AI-powered performance insights

#### **Backup & Recovery (8 tools)**
- List, create, restore, delete backups
- Backup status and validation
- Scheduled backups
- Export to external storage

#### **Security & Compliance (10 tools)**
- IP allowlist configuration
- SSL enforcement
- Credential rotation
- Audit logs
- Encryption settings
- Security vulnerability scans
- Password policies
- Two-factor authentication
- Compliance reports

#### **Cost Management (8 tools)**
- Detailed cost breakdown
- Cost forecasting
- Cost alerts
- AI-powered cost optimization
- Billing history
- Cost report exports
- Budget limits
- Resource right-sizing recommendations

#### **Integration & Webhooks (6 tools)**
- Create, list, delete webhooks
- Test webhook delivery
- Webhook logs
- API key generation

#### **Advanced SQL Tools (10 tools)**
- N+1 query detection
- Table partitioning recommendations
- Detailed table statistics
- VACUUM strategy optimization
- Missing index detection
- Join performance analysis
- Materialized view suggestions
- Table dependency analysis
- Query rewrite suggestions
- Deadlock analysis

#### **Neon Auth (1 tool)**
- Provision Neon Auth with Stack Auth integration

#### **API Key Management (3 tools)**
- List all API keys
- Create project-specific API keys
- Revoke/delete API keys

#### **Connection Pooling (2 tools)**
- Get connection pooler configuration
- Update pooler settings (PgBouncer)

#### **Read Replicas (2 tools)**
- Create read replica endpoints
- List all read replicas for a branch

#### **Project Sharing & Collaboration (3 tools)**
- Share projects with other users
- List all project shares
- Revoke project access

## Installation

```bash
npm install @robinsonai/neon-mcp
```

## Configuration

### For Augment Code / MCP Clients

1. Get your Neon API key from [Neon Console](https://console.neon.tech/app/settings/api-keys)

2. Import the `neon-mcp-config.json` file into your MCP client:

```json
{
  "mcpServers": {
    "neon": {
      "command": "npx",
      "args": [
        "neon-mcp",
        "YOUR_NEON_API_KEY_HERE"
      ]
    }
  }
}
```

Windows (VS Code Augment) – prefer absolute executables:

```json
{
  "mcpServers": {
    "neon": {
      "command": "C:\\nvm4w\\nodejs\\neon-mcp.cmd",
      "args": ["YOUR_NEON_API_KEY_HERE"]
    }
  }
}
```

Or explicit node + dist entry (no global link required):

```json
{
  "mcpServers": {
    "neon": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": [
        "C:\\Users\\chris\\Git Local\\robinsonai-mcp-servers\\packages\\neon-mcp\\dist\\index.js",
        "YOUR_NEON_API_KEY_HERE"
      ]
    }
  }
}
```

3. Replace `YOUR_NEON_API_KEY_HERE` with your actual Neon API key

4. Restart your MCP client to load the 145 tools

## Usage Examples

### Project Management
```typescript
// List all projects
list_projects({ limit: 10 })

// Create a new project
create_project({ name: "my-app", region_id: "aws-us-east-1" })

// Get project consumption metrics
get_project_consumption({ 
  projectId: "proj_123", 
  from: "2024-01-01", 
  to: "2024-01-31" 
})
```

### Branch Management
```typescript
// Create a development branch
create_branch({ 
  projectId: "proj_123", 
  branchName: "dev" 
})

// Compare schemas between branches
get_branch_schema_diff({
  projectId: "proj_123",
  sourceBranchId: "br_main",
  targetBranchId: "br_dev"
})

// Point-in-time recovery
restore_branch_to_timestamp({
  projectId: "proj_123",
  branchId: "br_main",
  timestamp: "2024-01-15T10:30:00Z"
})
```

### SQL Execution
```typescript
// Execute SQL
run_sql({
  projectId: "proj_123",
  sql: "SELECT * FROM users LIMIT 10"
})

// Get query execution plan
explain_sql_statement({
  projectId: "proj_123",
  sql: "SELECT * FROM orders WHERE status = 'pending'",
  analyze: true
})

// Find slow queries
list_slow_queries({
  projectId: "proj_123",
  minExecutionTime: 1000,
  limit: 20
})
```

### Monitoring
```typescript
// Get performance insights
get_performance_insights({
  projectId: "proj_123",
  branchId: "br_main",
  databaseName: "mydb"
})

// Check table bloat
get_table_bloat({
  projectId: "proj_123",
  databaseName: "mydb"
})

// Get index usage statistics
get_index_usage({
  projectId: "proj_123",
  databaseName: "mydb",
  tableName: "users"
})
```

### Cost Management
```typescript
// Get cost breakdown
get_cost_breakdown({
  projectId: "proj_123",
  from: "2024-01-01",
  to: "2024-01-31"
})

// Get cost optimization tips
get_cost_optimization_tips({
  projectId: "proj_123"
})

// Set budget alerts
set_cost_alerts({
  projectId: "proj_123",
  threshold: 100,
  email: "admin@example.com"
})
```

## Development

```bash
# Build
npm run build

# Test
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npx neon-mcp YOUR_API_KEY
```

## License

MIT

## Author

Robinson AI Systems

