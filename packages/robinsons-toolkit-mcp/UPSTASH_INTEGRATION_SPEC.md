# Upstash Integration Specification for Robinson's Toolkit

## Overview
Complete integration of Upstash Management API + Redis REST API into Robinson's Toolkit MCP server.

**Total Tools: 140**
- Layer 1: Upstash Management API (50 tools)
- Layer 2: Upstash Redis REST API (90 tools)

## Implementation Status

### ✅ COMPLETED
1. Updated imports (removed Redis Cloud TCP client)
2. Added Upstash environment variables to constructor
3. Created HTTP client helper methods:
   - `upstashManagementFetch()` - For Management API
   - `upstashRedisFetch()` - For Redis REST API
   - `upstashRedisPipeline()` - For batch operations
   - `upstashRedisTransaction()` - For atomic operations

### 🚧 IN PROGRESS
4. Adding tool definitions (currently at 54/140 tools added)
5. Adding case handlers
6. Adding method implementations

### ⏳ TODO
7. Build and test
8. Update tool count in `async run()`
9. Create test script

## Tool Categories

### Layer 1: Upstash Management API (50 tools)

#### Redis Database Management (15 tools)
- upstash_list_redis_databases
- upstash_get_redis_database
- upstash_create_redis_database
- upstash_delete_redis_database
- upstash_rename_redis_database
- upstash_reset_redis_password
- upstash_enable_redis_eviction
- upstash_disable_redis_eviction
- upstash_enable_redis_tls
- upstash_disable_redis_tls
- upstash_get_redis_stats
- upstash_backup_redis_database
- upstash_restore_redis_database
- upstash_update_redis_database
- upstash_get_redis_usage

#### Team Management (6 tools)
- upstash_list_teams
- upstash_get_team
- upstash_create_team
- upstash_delete_team
- upstash_add_team_member
- upstash_remove_team_member

#### Vector Index Management (8 tools)
- upstash_list_vector_indexes
- upstash_get_vector_index
- upstash_create_vector_index
- upstash_delete_vector_index
- upstash_rename_vector_index
- upstash_reset_vector_password
- upstash_set_vector_plan
- upstash_transfer_vector_index

#### Account & Billing (6 tools)
- upstash_get_account_info
- upstash_get_billing_info
- upstash_list_invoices
- upstash_get_invoice
- upstash_get_usage_stats
- upstash_export_usage_report

#### API Key Management (5 tools)
- upstash_list_api_keys
- upstash_create_api_key
- upstash_delete_api_key
- upstash_get_api_key
- upstash_rotate_api_key

#### Regions & Availability (5 tools)
- upstash_list_regions
- upstash_get_region_info
- upstash_check_region_availability
- upstash_get_pricing_info
- upstash_list_available_plans

#### Monitoring & Alerts (5 tools)
- upstash_list_alerts
- upstash_create_alert
- upstash_delete_alert
- upstash_get_alert_history
- upstash_test_alert

### Layer 2: Upstash Redis REST API (90 tools)

#### String Operations (17 tools) ✅ ADDED
- upstash_redis_get
- upstash_redis_set
- upstash_redis_mget
- upstash_redis_mset
- upstash_redis_incr
- upstash_redis_decr
- upstash_redis_incrby
- upstash_redis_decrby
- upstash_redis_incrbyfloat
- upstash_redis_append
- upstash_redis_getrange
- upstash_redis_setrange
- upstash_redis_strlen
- upstash_redis_getset
- upstash_redis_setnx
- upstash_redis_setex
- upstash_redis_psetex

#### Hash Operations (15 tools)
- upstash_redis_hset
- upstash_redis_hget
- upstash_redis_hgetall
- upstash_redis_hdel
- upstash_redis_hexists
- upstash_redis_hkeys
- upstash_redis_hvals
- upstash_redis_hlen
- upstash_redis_hincrby
- upstash_redis_hincrbyfloat
- upstash_redis_hmget
- upstash_redis_hmset
- upstash_redis_hsetnx
- upstash_redis_hstrlen
- upstash_redis_hscan

#### List Operations (14 tools)
- upstash_redis_lpush
- upstash_redis_rpush
- upstash_redis_lpop
- upstash_redis_rpop
- upstash_redis_lrange
- upstash_redis_llen
- upstash_redis_lindex
- upstash_redis_lset
- upstash_redis_lrem
- upstash_redis_ltrim
- upstash_redis_linsert
- upstash_redis_rpoplpush
- upstash_redis_lpos
- upstash_redis_lmove

#### Set Operations (15 tools)
- upstash_redis_sadd
- upstash_redis_smembers
- upstash_redis_srem
- upstash_redis_sismember
- upstash_redis_scard
- upstash_redis_spop
- upstash_redis_srandmember
- upstash_redis_smove
- upstash_redis_sunion
- upstash_redis_sinter
- upstash_redis_sdiff
- upstash_redis_sunionstore
- upstash_redis_sinterstore
- upstash_redis_sdiffstore
- upstash_redis_sscan

#### Sorted Set Operations (23 tools)
- upstash_redis_zadd
- upstash_redis_zrange
- upstash_redis_zrem
- upstash_redis_zscore
- upstash_redis_zcard
- upstash_redis_zrank
- upstash_redis_zrevrank
- upstash_redis_zrangebyscore
- upstash_redis_zrevrangebyscore
- upstash_redis_zremrangebyrank
- upstash_redis_zremrangebyscore
- upstash_redis_zpopmin
- upstash_redis_zpopmax
- upstash_redis_zincrby
- upstash_redis_zcount
- upstash_redis_zunionstore
- upstash_redis_zinterstore
- upstash_redis_zscan
- upstash_redis_zrangebylex
- upstash_redis_zrevrangebylex
- upstash_redis_zremrangebylex
- upstash_redis_zlexcount
- upstash_redis_zmscore

#### Geospatial Operations (7 tools)
- upstash_redis_geoadd
- upstash_redis_geodist
- upstash_redis_geohash
- upstash_redis_geopos
- upstash_redis_georadius
- upstash_redis_georadiusbymember
- upstash_redis_geosearch

#### HyperLogLog Operations (3 tools)
- upstash_redis_pfadd
- upstash_redis_pfcount
- upstash_redis_pfmerge

#### Bitmap Operations (5 tools)
- upstash_redis_setbit
- upstash_redis_getbit
- upstash_redis_bitcount
- upstash_redis_bitpos
- upstash_redis_bitop

#### Stream Operations (12 tools)
- upstash_redis_xadd
- upstash_redis_xread
- upstash_redis_xrange
- upstash_redis_xrevrange
- upstash_redis_xlen
- upstash_redis_xdel
- upstash_redis_xtrim
- upstash_redis_xack
- upstash_redis_xpending
- upstash_redis_xclaim
- upstash_redis_xinfo
- upstash_redis_xgroup

#### Generic Operations (10 tools)
- upstash_redis_del
- upstash_redis_exists
- upstash_redis_expire
- upstash_redis_expireat
- upstash_redis_ttl
- upstash_redis_pttl
- upstash_redis_persist
- upstash_redis_keys
- upstash_redis_scan
- upstash_redis_rename

#### Server Operations (10 tools)
- upstash_redis_ping
- upstash_redis_echo
- upstash_redis_dbsize
- upstash_redis_flushdb
- upstash_redis_flushall
- upstash_redis_info
- upstash_redis_time
- upstash_redis_lastsave
- upstash_redis_save
- upstash_redis_bgsave

#### Pub/Sub Operations (2 tools)
- upstash_redis_publish
- upstash_redis_pubsub_channels

#### Pipeline & Transaction (2 tools)
- upstash_redis_pipeline
- upstash_redis_transaction

## Next Steps

1. Continue adding remaining tool definitions (86 more tools)
2. Add all case handlers in switch statement
3. Implement all methods
4. Build and test
5. Update documentation

