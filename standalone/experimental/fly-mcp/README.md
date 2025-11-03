# @robinsonai/fly-mcp

Comprehensive Fly.io MCP server with **83 tools** for complete deployment automation and management.

## Features

### 🚀 **83 Comprehensive Tools**

#### **App Management (15 tools)**
- Create, delete, list, get, update apps
- Restart, suspend, resume apps
- Clone, transfer apps between orgs
- Get app status, metrics, logs
- Scale apps, set regions

#### **Deployment (12 tools)**
- Deploy from Dockerfile, Docker image, or Git
- Get deployment details and status
- List deployments, rollback, cancel
- Get deployment logs
- Promote deployments, create releases

#### **Secrets Management (8 tools)**
- Set single or multiple secrets
- Unset, list secrets
- Import/export secrets
- Rotate secrets, get history

#### **Volume Management (10 tools)**
- Create, delete, list volumes
- Extend volume size
- Snapshot, restore, clone volumes
- Attach/detach volumes to machines

#### **Machine Management (12 tools)**
- Create, delete, list machines
- Start, stop, restart machines
- Update machine config
- Get machine logs and metrics
- Execute commands, SSH access

#### **Networking (8 tools)**
- Allocate/release IP addresses
- List IPs
- Create/delete SSL certificates
- Add/remove custom domains

#### **Monitoring & Logs (8 tools)**
- Get and stream logs
- Get metrics and health checks
- Create/delete monitoring alerts
- Get incident history

#### **Organization & Billing (7 tools)**
- List, create, get organizations
- Invite/remove members
- Get billing info and usage stats

#### **Setup Automation (3 tools)** - NEW!
- `fly_check_api_token` - Check if API token is configured
- `fly_deploy_rad_crawler` - Deploy RAD crawler with optimal settings
- `fly_setup_rad_crawlers` - Deploy multiple crawlers autonomously

## Installation

```bash
# Install dependencies
cd packages/fly-mcp
npm install
npm run build
```

## Configuration

### With Environment Variable (Recommended)

```bash
export FLY_API_TOKEN="your_fly_api_token_here"
```

### In Augment Code MCP Config

```json
{
  "mcpServers": {
    "fly": {
      "command": "npx",
      "args": ["-y", "@robinsonai/fly-mcp"],
      "env": {
        "FLY_API_TOKEN": "your_fly_api_token_here"
      }
    }
  }
}
```

### Get Your API Token

1. Go to https://fly.io/user/personal_access_tokens
2. Create new token
3. Copy and save securely

## Graceful Degradation

**If FLY_API_TOKEN is not set:**
- ✅ Server starts successfully
- ✅ Tools are listed
- ⚠️  Tools return helpful error messages
- ✅ Robinson's Toolkit continues working with other integrations

**Example error when token missing:**
```json
{
  "error": "Fly.io API token not configured",
  "message": "Set FLY_API_TOKEN environment variable to enable Fly.io tools.",
  "instructions": "Get your API token from: https://fly.io/user/personal_access_tokens"
}
```

## Usage Examples

### Check API Token

```typescript
// Check if Fly.io is configured
fly_check_api_token()

// Returns:
{
  "enabled": true,
  "message": "Fly.io API token is valid and working!",
  "apps_count": 5
}
```

### Deploy RAD Crawler

```typescript
fly_deploy_rad_crawler({
  name: "rad-crawler-1",
  region: "ord",
  secrets: {
    NEON_DATABASE_URL: "postgresql://...",
    REDIS_URL: "redis://...",
    TENANT_ID: "your-tenant-id"
  }
})
```

### Deploy Multiple Crawlers

```typescript
fly_setup_rad_crawlers({
  count: 3,
  region: "ord",
  secrets: {
    NEON_DATABASE_URL: "postgresql://...",
    REDIS_URL: "redis://..."
  }
})
```

## Tool Categories

### App Management
- `fly_create_app` - Create new app
- `fly_delete_app` - Delete app
- `fly_list_apps` - List all apps
- `fly_get_app` - Get app details
- `fly_update_app` - Update config
- `fly_restart_app` - Restart all machines
- `fly_suspend_app` - Stop all machines
- `fly_resume_app` - Resume app
- `fly_clone_app` - Clone to new name
- `fly_transfer_app` - Transfer to org
- `fly_get_app_status` - Get health status
- `fly_get_app_metrics` - Get metrics
- `fly_get_app_logs` - Get logs
- `fly_scale_app` - Scale instances
- `fly_set_app_regions` - Set regions

### Deployment
- `fly_deploy` - Deploy from Dockerfile
- `fly_deploy_image` - Deploy from image
- `fly_deploy_git` - Deploy from Git
- `fly_get_deployment` - Get details
- `fly_list_deployments` - List deployments
- `fly_rollback` - Rollback deployment
- `fly_cancel_deployment` - Cancel deployment
- `fly_get_deployment_logs` - Get logs
- `fly_get_deployment_status` - Get status
- `fly_promote_deployment` - Promote to prod
- `fly_create_release` - Create release
- `fly_list_releases` - List releases

### Secrets
- `fly_set_secret` - Set single secret
- `fly_set_secrets` - Set multiple secrets
- `fly_unset_secret` - Remove secret
- `fly_list_secrets` - List secret names
- `fly_import_secrets` - Import from file
- `fly_export_secrets` - Export names
- `fly_rotate_secret` - Rotate value
- `fly_get_secret_history` - Get history

### Volumes
- `fly_create_volume` - Create volume
- `fly_delete_volume` - Delete volume
- `fly_list_volumes` - List volumes
- `fly_get_volume` - Get details
- `fly_extend_volume` - Extend size
- `fly_snapshot_volume` - Create snapshot
- `fly_restore_volume` - Restore from snapshot
- `fly_clone_volume` - Clone volume
- `fly_attach_volume` - Attach to machine
- `fly_detach_volume` - Detach from machine

### Machines
- `fly_create_machine` - Create machine
- `fly_delete_machine` - Delete machine
- `fly_list_machines` - List machines
- `fly_get_machine` - Get details
- `fly_start_machine` - Start machine
- `fly_stop_machine` - Stop machine
- `fly_restart_machine` - Restart machine
- `fly_update_machine` - Update config
- `fly_get_machine_logs` - Get logs
- `fly_get_machine_metrics` - Get metrics
- `fly_exec_machine` - Execute command
- `fly_ssh_machine` - Get SSH info

### Networking
- `fly_allocate_ip` - Allocate IP
- `fly_release_ip` - Release IP
- `fly_list_ips` - List IPs
- `fly_create_certificate` - Create SSL cert
- `fly_list_certificates` - List certs
- `fly_delete_certificate` - Delete cert
- `fly_add_domain` - Add custom domain
- `fly_remove_domain` - Remove domain

### Monitoring
- `fly_get_logs` - Get logs
- `fly_stream_logs` - Stream logs
- `fly_get_metrics` - Get metrics
- `fly_get_health_checks` - Get health status
- `fly_create_alert` - Create alert
- `fly_list_alerts` - List alerts
- `fly_delete_alert` - Delete alert
- `fly_get_incidents` - Get incidents

### Organization
- `fly_list_orgs` - List orgs
- `fly_create_org` - Create org
- `fly_get_org` - Get org details
- `fly_invite_member` - Invite member
- `fly_remove_member` - Remove member
- `fly_get_billing` - Get billing info
- `fly_get_usage` - Get usage stats

## Development Status

**Phase 1: Complete** ✅
- 83 tools defined
- Graceful degradation implemented
- Setup automation tools ready
- Package builds successfully

**Phase 2: In Progress** 🚧
- Full implementation of all 83 tools
- Integration with Robinson's Toolkit
- Testing with real Fly.io API

## License

MIT

## Author

Robinson AI Systems

