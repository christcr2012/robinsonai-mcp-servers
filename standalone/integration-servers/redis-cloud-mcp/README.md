# @robinsonai/redis-cloud-mcp

Comprehensive Redis Cloud MCP server with **53 tools** for complete database provisioning and management via Redis Cloud API.

## Features

### 🚀 **53 Comprehensive Tools**

#### **Account Management (5 tools)**
- Check credentials, get account info
- List payment methods, system logs
- Manage cloud provider accounts

#### **Subscription Management (12 tools)**
- Create, list, get, update, delete subscriptions
- Manage CIDR whitelist
- Configure VPC peering
- Get pricing and backup configuration

#### **Database Management (20 tools)**
- Create, list, get, update, delete databases
- Get connection strings/URLs
- Backup, import, restore databases
- Get metrics, flush data
- Enable Redis modules (RediSearch, RedisJSON, etc.)
- Configure alerts, slowlog
- Scale databases (memory/throughput)

#### **Cloud Account Management (8 tools)**
- Create/manage cloud provider accounts (AWS, GCP, Azure)
- List available regions and plans
- Get database plans

#### **Tasks & Monitoring (5 tools)**
- List and track background tasks
- Get database, subscription, and account statistics

#### **Setup Automation (3 tools)** - NEW!
- `redis_cloud_setup_rad_database` - Complete autonomous setup
- `redis_cloud_get_database_url` - Get formatted connection URL
- `redis_cloud_test_connection` - Test Redis connection

## Installation

```bash
cd packages/redis-cloud-mcp
npm install
npm run build
```

## Configuration

### Get API Credentials

1. Go to https://cloud.redis.io/#/account
2. Navigate to **Account Settings** → **API Keys**
3. Create new API key
4. Copy **API Key** and **API Secret**

### With Environment Variables (Recommended)

```bash
export REDIS_CLOUD_API_KEY="your_api_key_here"
export REDIS_CLOUD_API_SECRET="your_api_secret_here"
```

### In Augment Code MCP Config

```json
{
  "mcpServers": {
    "redis-cloud": {
      "command": "npx",
      "args": ["-y", "@robinsonai/redis-cloud-mcp"],
      "env": {
        "REDIS_CLOUD_API_KEY": "your_api_key_here",
        "REDIS_CLOUD_API_SECRET": "your_api_secret_here"
      }
    }
  }
}
```

## Graceful Degradation

**If credentials are not set:**
- ✅ Server starts successfully
- ✅ Tools are listed
- ⚠️  Tools return helpful error messages
- ✅ Robinson's Toolkit continues working with other integrations

## Usage Examples

### Check API Credentials

```typescript
redis_cloud_check_credentials()

// Returns:
{
  "enabled": true,
  "message": "Redis Cloud API credentials are valid and working!"
}
```

### Create Database

```typescript
redis_cloud_create_database({
  subscriptionId: 12345,
  name: "rad-crawler-redis",
  memoryLimitInGb: 1,
  replication: true,
  dataPersistence: "aof-every-1-second",
  dataEvictionPolicy: "volatile-lru"
})
```

### Autonomous RAD Database Setup

```typescript
redis_cloud_setup_rad_database({
  name: "RAD Crawler Redis",
  cloudProvider: "AWS",
  region: "us-east-1",
  memoryLimitInGb: 1,
  replication: true
})

// Returns:
{
  "subscription_id": 12345,
  "database_id": 67890,
  "connection_url": "redis://default:password@host:port",
  "message": "RAD Redis database created successfully!"
}
```

### Get Database Connection URL

```typescript
redis_cloud_get_database_url({
  subscriptionId: 12345,
  databaseId: 67890
})

// Returns formatted URL for REDIS_URL env var
```

## Tool Categories

### Account Management
- `redis_cloud_check_credentials` - Check if credentials are valid
- `redis_cloud_get_account` - Get account information
- `redis_cloud_get_payment_methods` - List payment methods
- `redis_cloud_get_system_logs` - Get system logs
- `redis_cloud_get_cloud_accounts` - List cloud accounts

### Subscription Management
- `redis_cloud_create_subscription` - Create new subscription
- `redis_cloud_list_subscriptions` - List all subscriptions
- `redis_cloud_get_subscription` - Get subscription details
- `redis_cloud_update_subscription` - Update subscription
- `redis_cloud_delete_subscription` - Delete subscription
- `redis_cloud_get_subscription_cidr_whitelist` - Get CIDR whitelist
- `redis_cloud_update_subscription_cidr_whitelist` - Update CIDR
- `redis_cloud_get_subscription_vpc_peering` - Get VPC peering
- `redis_cloud_create_subscription_vpc_peering` - Create VPC peering
- `redis_cloud_delete_subscription_vpc_peering` - Delete VPC peering
- `redis_cloud_get_subscription_pricing` - Get pricing
- `redis_cloud_get_subscription_backup` - Get backup config

### Database Management
- `redis_cloud_create_database` - Create database
- `redis_cloud_list_databases` - List databases
- `redis_cloud_get_database` - Get database details
- `redis_cloud_update_database` - Update database
- `redis_cloud_delete_database` - Delete database
- `redis_cloud_get_database_connection_string` - Get connection string
- `redis_cloud_backup_database` - Create backup
- `redis_cloud_import_database` - Import data
- `redis_cloud_get_database_metrics` - Get metrics
- `redis_cloud_flush_database` - Flush all data
- `redis_cloud_get_database_modules` - Get enabled modules
- `redis_cloud_enable_database_module` - Enable module
- `redis_cloud_get_database_alerts` - Get alerts
- `redis_cloud_update_database_alerts` - Update alerts
- `redis_cloud_get_database_backup_status` - Get backup status
- `redis_cloud_restore_database` - Restore from backup
- `redis_cloud_get_database_slowlog` - Get slow query log
- `redis_cloud_get_database_config` - Get Redis config
- `redis_cloud_update_database_config` - Update config
- `redis_cloud_scale_database` - Scale database

### Cloud Account Management
- `redis_cloud_create_cloud_account` - Create cloud account
- `redis_cloud_list_cloud_accounts` - List cloud accounts
- `redis_cloud_get_cloud_account` - Get cloud account
- `redis_cloud_update_cloud_account` - Update cloud account
- `redis_cloud_delete_cloud_account` - Delete cloud account
- `redis_cloud_get_regions` - List available regions
- `redis_cloud_get_plans` - List subscription plans
- `redis_cloud_get_database_plans` - List database plans

### Tasks & Monitoring
- `redis_cloud_get_tasks` - List background tasks
- `redis_cloud_get_task` - Get task status
- `redis_cloud_get_database_stats` - Get database statistics
- `redis_cloud_get_subscription_stats` - Get subscription stats
- `redis_cloud_get_account_stats` - Get account stats

### Setup Automation
- `redis_cloud_setup_rad_database` - Complete autonomous setup
- `redis_cloud_get_database_url` - Get formatted connection URL
- `redis_cloud_test_connection` - Test connection

## Redis Cloud vs Redis MCP

### Redis Cloud MCP (This Package)
**Purpose:** Provision and manage Redis Cloud infrastructure
- ✅ Create/delete databases
- ✅ Manage subscriptions
- ✅ Configure backups, alerts
- ✅ Scale databases
- ❌ Cannot run Redis commands

**Needs:** Redis Cloud API credentials

### Redis MCP
**Purpose:** Work with data inside Redis databases
- ✅ SET/GET keys
- ✅ Manage lists, sets, hashes
- ✅ Pub/sub messaging
- ✅ Run any Redis command
- ❌ Cannot create databases

**Needs:** Redis connection URL

### Together They're Powerful!

```typescript
// 1. Use Redis Cloud MCP to create database
const result = await redis_cloud_setup_rad_database({
  name: "My Redis DB"
});

// 2. Use Redis MCP to work with data
await redis_set("key", "value", { url: result.connection_url });
await redis_get("key", { url: result.connection_url });
```

## Development Status

**Phase 1: Complete** ✅
- 53 tools defined
- Graceful degradation implemented
- Setup automation tools ready
- Package builds successfully

**Phase 2: Ready for Testing** 🧪
- Full API implementation complete
- Needs Redis Cloud API credentials to test
- Integration with Robinson's Toolkit pending

## API Documentation

Full Redis Cloud API documentation:
https://docs.redis.com/latest/rc/api/

## License

MIT

## Author

Robinson AI Systems

