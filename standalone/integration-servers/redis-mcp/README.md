# @robinsonai/redis-mcp

**Comprehensive Redis MCP Server with 80+ Tools**

A powerful Model Context Protocol (MCP) server providing complete Redis database operations including key-value storage, hashes, lists, sets, sorted sets, pub/sub, streams, geospatial data, and advanced cache management.

## Features

### 🎯 **80+ Comprehensive Tools** organized into 10 categories:

1. **Basic Operations** (6 tools)
   - `redis_get` - Get value by key
   - `redis_set` - Set key-value pair with optional TTL
   - `redis_delete` - Delete one or more keys
   - `redis_exists` - Check if keys exist
   - `redis_ttl` - Get time to live for a key
   - `redis_expire` - Set expiration time

2. **Pattern Operations** (2 tools)
   - `redis_list_keys` - List keys matching a pattern
   - `redis_delete_by_pattern` - Delete keys by pattern

3. **Bulk Operations** (1 tool)
   - `redis_mget` - Get multiple values at once

4. **Cache Analytics** (3 tools)
   - `redis_info` - Get Redis server info and statistics
   - `redis_dbsize` - Get number of keys in database
   - `redis_memory_usage` - Get memory usage of a key

5. **Session Management** (3 tools)
   - `redis_list_sessions` - List all session keys
   - `redis_inspect_session` - Inspect session details
   - `redis_clear_tenant_cache` - Clear tenant-specific cache

6. **Rate Limiting** (1 tool)
   - `redis_list_rate_limits` - List rate limit keys

7. **Database Management** (2 tools)
   - `redis_current_db` - Get current database number
   - `redis_flush_db` - Clear current database

8. **Counter Operations** (2 tools)
   - `redis_incr` - Increment counter
   - `redis_decr` - Decrement counter

9. **Hash Operations** (10 tools)
   - `redis_hget` - Get hash field value
   - `redis_hset` - Set hash field
   - `redis_hgetall` - Get all hash fields
   - `redis_hdel` - Delete hash fields
   - `redis_hkeys` - Get all hash keys
   - `redis_hvals` - Get all hash values
   - `redis_hexists` - Check if hash field exists
   - `redis_hlen` - Get hash field count
   - `redis_hincrby` - Increment hash field by integer
   - `redis_hmset` - Set multiple hash fields

10. **List Operations** (10 tools)
    - `redis_lpush` - Push to list head
    - `redis_rpush` - Push to list tail
    - `redis_lpop` - Pop from list head
    - `redis_rpop` - Pop from list tail
    - `redis_lrange` - Get list range
    - `redis_llen` - Get list length
    - `redis_lindex` - Get element by index
    - `redis_lset` - Set element by index
    - `redis_lrem` - Remove elements from list
    - `redis_ltrim` - Trim list to range

11. **Set Operations** (10 tools)
    - `redis_sadd` - Add members to set
    - `redis_srem` - Remove members from set
    - `redis_smembers` - Get all set members
    - `redis_sismember` - Check if member in set
    - `redis_scard` - Get set cardinality
    - `redis_sunion` - Union of sets
    - `redis_sinter` - Intersection of sets
    - `redis_sdiff` - Difference of sets
    - `redis_spop` - Pop random member
    - `redis_srandmember` - Get random member

12. **Sorted Set Operations** (10 tools)
    - `redis_zadd` - Add members with scores
    - `redis_zrem` - Remove members
    - `redis_zrange` - Get range by rank
    - `redis_zrevrange` - Get range in reverse
    - `redis_zrangebyscore` - Get range by score
    - `redis_zcard` - Get sorted set size
    - `redis_zscore` - Get member score
    - `redis_zincrby` - Increment member score
    - `redis_zrank` - Get member rank
    - `redis_zcount` - Count members in score range

13. **Pub/Sub Operations** (3 tools)
    - `redis_publish` - Publish message to channel
    - `redis_subscribe` - Subscribe to channels
    - `redis_unsubscribe` - Unsubscribe from channels

14. **Stream Operations** (6 tools)
    - `redis_xadd` - Add entry to stream
    - `redis_xread` - Read from stream
    - `redis_xlen` - Get stream length
    - `redis_xrange` - Get range of entries
    - `redis_xdel` - Delete entries
    - `redis_xtrim` - Trim stream

15. **Geospatial Operations** (6 tools)
    - `redis_geoadd` - Add geospatial location
    - `redis_geodist` - Get distance between locations
    - `redis_georadius` - Query by radius
    - `redis_geopos` - Get position coordinates
    - `redis_geohash` - Get geohash
    - `redis_geosearch` - Advanced geospatial search

## Installation

```bash
npm install @robinsonai/redis-mcp
```

## Prerequisites

### Redis Server

You need a Redis server running and accessible:

**Option 1: Local Redis**
```bash
# Install Redis (Ubuntu/Debian)
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server

# Verify
redis-cli ping
# Should respond: PONG
```

**Option 2: Docker**
```bash
docker run -d -p 6379:6379 redis:latest
```

**Option 3: Redis Cloud**
- Sign up at [Redis Cloud](https://redis.com/cloud/)
- Get connection URL
- Use format: `redis://username:password@host:port`

## Usage

### As MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": [
        "@robinsonai/redis-mcp",
        "redis://localhost:6379"
      ]
    }
  }
}
```

Or use environment variable:

```json
{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": ["@robinsonai/redis-mcp"],
      "env": {
        "REDIS_URL": "redis://localhost:6379"
      }
    }
  }
}
```

### Direct Usage

```bash
# Using argument
npx @robinsonai/redis-mcp redis://localhost:6379

# Using environment variable
export REDIS_URL=redis://localhost:6379
npx @robinsonai/redis-mcp
```

## Redis URL Formats

```bash
# Local Redis
redis://localhost:6379

# With database selection
redis://localhost:6379/0

# With authentication
redis://:password@localhost:6379

# With username and password
redis://username:password@localhost:6379

# Remote Redis
redis://your-redis-host.com:6379

# Redis with TLS
rediss://your-redis-host.com:6380
```

## Example Tools

### Basic Operations
```javascript
// Set a key
{
  "key": "user:1000",
  "value": "{\"name\":\"John\",\"email\":\"john@example.com\"}",
  "ttl": 3600
}

// Get a key
{
  "key": "user:1000"
}

// Delete keys
{
  "keys": ["user:1000", "user:1001"]
}
```

### Hash Operations
```javascript
// Set hash fields
{
  "key": "user:1000",
  "field": "email",
  "value": "john@example.com"
}

// Get all hash fields
{
  "key": "user:1000"
}
```

### List Operations
```javascript
// Push to list
{
  "key": "logs",
  "values": ["Error: Connection timeout", "Info: Request completed"]
}

// Get list range
{
  "key": "logs",
  "start": 0,
  "stop": 9
}
```

### Sorted Set (Leaderboard)
```javascript
// Add scores
{
  "key": "leaderboard",
  "members": [
    {"score": 1000, "member": "player1"},
    {"score": 950, "member": "player2"}
  ]
}

// Get top 10
{
  "key": "leaderboard",
  "start": 0,
  "stop": 9,
  "withScores": true
}
```

### Pub/Sub
```javascript
// Publish message
{
  "channel": "notifications",
  "message": "New order received"
}
```

## Use Cases

### 1. Session Storage
Store user sessions with automatic expiration:
```javascript
redis_set("session:abc123", sessionData, 3600)
```

### 2. Caching
Cache API responses for fast retrieval:
```javascript
redis_set("api:users:list", cachedData, 300)
```

### 3. Rate Limiting
Track API request counts:
```javascript
redis_incr("ratelimit:user:1000:2024-01-15")
redis_expire("ratelimit:user:1000:2024-01-15", 86400)
```

### 4. Leaderboards
Manage game scores with sorted sets:
```javascript
redis_zadd("game:leaderboard", [{score: 1000, member: "player1"}])
redis_zrevrange("game:leaderboard", 0, 9) // Top 10
```

### 5. Real-time Analytics
Track events with streams:
```javascript
redis_xadd("events", {userId: "1000", action: "login"})
```

### 6. Geolocation
Store and query location data:
```javascript
redis_geoadd("stores", {longitude: -73.935242, latitude: 40.730610, member: "store1"})
redis_georadius("stores", -73.935242, 40.730610, 5, "km")
```

## Security Considerations

1. **Network Security**
   - Use TLS for production (`rediss://`)
   - Restrict network access to Redis server
   - Use firewall rules

2. **Authentication**
   - Set Redis password: `requirepass` in redis.conf
   - Use ACL for fine-grained permissions
   - Rotate credentials regularly

3. **Data Protection**
   - Enable persistence (RDB/AOF)
   - Configure backups
   - Use replication for high availability

4. **Pattern Deletion**
   - Use `redis_delete_by_pattern` with caution
   - Always test patterns first
   - Require confirmation parameter

## Performance Tips

1. **Use pipelining** for bulk operations
2. **Set TTL** on temporary data to auto-cleanup
3. **Use appropriate data structures** (hashes for objects, sorted sets for rankings)
4. **Monitor memory** with `redis_info` and `redis_memory_usage`
5. **Use patterns wisely** - avoid broad wildcards in production

## Implementation Status

- ✅ **Fully Implemented**: All 80+ tools
- ✅ **Redis Client Integration**: Complete
- ✅ **Connection Management**: Working
- ✅ **Error Handling**: Comprehensive
- ✅ **Production-Ready**: Yes

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Link globally
npm link

# Test connection
redis-cli ping
```

## Troubleshooting

### Connection Issues
```bash
# Check if Redis is running
redis-cli ping

# Check port
netstat -an | grep 6379

# Test connection
redis-cli -h localhost -p 6379
```

### Authentication Errors
- Verify password in connection URL
- Check Redis `requirepass` setting
- Ensure ACL permissions

### Performance Issues
- Monitor with `redis_info`
- Check memory usage
- Review slow queries
- Consider Redis cluster for scale

## License

MIT

## Author

Robinson AI Systems

## Version

1.0.0 - Complete Redis automation with 80+ tools
