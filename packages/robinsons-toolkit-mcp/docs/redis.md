# Redis

Redis database operations via Upstash (alias for upstash category)

**Category ID:** `redis`  
**Total Tools:** 80  
**Subcategories:** None

## 📊 Tool Statistics

- 🟢 Safe (read-only): 3
- 🟡 Caution (modifying): 74
- 🔴 Dangerous (destructive): 3

## 🔧 Tools

### 🟡 `redis_append`

Append a value to a key

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_bitcount`

Count set bits in a string

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_clear_tenant_cache`

Clear all cache entries for a specific tenant

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_current_db`

Show current database context (provider or tenant)

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_dbsize`

Get total number of keys in current database

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_decr`

Decrement the integer value of a key by 1

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_decrby`

Decrement the integer value of a key by a specific amount

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🔴 `redis_delete`

Delete one or more keys from Redis

**Tags:** `database`  
**Danger Level:** `dangerous`  
**Subcategory:** None


---

### 🔴 `redis_delete_by_pattern`

Delete all keys matching a pattern (DANGEROUS - use with caution)

**Tags:** `database`  
**Danger Level:** `dangerous`  
**Subcategory:** None


---

### 🟡 `redis_exists`

Check if key(s) exist in Redis

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_expire`

Set expiration time for a key

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_flush_db`

Clear all keys in current database (DANGEROUS)

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_geoadd`

Add geospatial items (longitude, latitude, member)

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_geodist`

Get distance between two members

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_georadius`

Query members within radius

**Tags:** `database` `query`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_get`

Get value by key from Redis

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_getbit`

Get bit value at offset

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_getrange`

Get substring of string value

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🔴 `redis_hdel`

Delete one or more hash fields

**Tags:** `database`  
**Danger Level:** `dangerous`  
**Subcategory:** None


---

### 🟡 `redis_hexists`

Check if a hash field exists

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_hget`

Get field value from a hash

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_hgetall`

Get all fields and values from a hash

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_hkeys`

Get all field names in a hash

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_hlen`

Get the number of fields in a hash

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_hscan`

Incrementally iterate hash fields

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_hset`

Set field in a hash

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_hvals`

Get all values in a hash

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_incr`

Increment the integer value of a key by 1

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_incrby`

Increment the integer value of a key by a specific amount

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_info`

Get Redis server information and statistics

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_inspect_session`

Get detailed information about a session

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_linsert`

Insert element before or after pivot in list

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟢 `redis_list_keys`

List Redis keys matching a pattern (use * for wildcard)

**Tags:** `database`  
**Danger Level:** `safe`  
**Subcategory:** None


---

### 🟢 `redis_list_rate_limits`

List all rate limit entries

**Tags:** `database`  
**Danger Level:** `safe`  
**Subcategory:** None


---

### 🟢 `redis_list_sessions`

List all active sessions (keys matching session:*)

**Tags:** `database`  
**Danger Level:** `safe`  
**Subcategory:** None


---

### 🟡 `redis_llen`

Get the length of a list

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_lpop`

Remove and get the first element in a list

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_lpush`

Prepend one or multiple values to a list

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_lrange`

Get a range of elements from a list

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_memory_usage`

Get memory usage for a specific key

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_mget`

Get multiple values by keys

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_persist`

Remove the expiration from a key

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_pfadd`

Add elements to HyperLogLog

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_pfcount`

Get cardinality of HyperLogLog

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_publish`

Publish a message to a channel

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_rename`

Rename a key

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_rpop`

Remove and get the last element in a list

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_rpush`

Append one or multiple values to a list

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_sadd`

Add one or more members to a set

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_scan`

Incrementally iterate keys

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_scard`

Get the number of members in a set

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_sdiff`

Difference of sets

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_set`

Set a Redis key-value pair with optional TTL

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_setbit`

Set or clear bit at offset

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_setrange`

Overwrite part of string at offset

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_sinter`

Intersect multiple sets

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_sismember`

Check if a value is a member of a set

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_smembers`

Get all members of a set

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_srem`

Remove one or more members from a set

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_sscan`

Incrementally iterate set members

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_strlen`

Get the length of the value stored in a key

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_sunion`

Union multiple sets

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_ttl`

Get TTL (time to live) for a key in seconds

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_type`

Get the type of a key (string, list, set, zset, hash)

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_xadd`

Add entry to a stream

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_xlen`

Get the length of a stream

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_xrange`

Get range of entries from a stream

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_xread`

Read entries from one or more streams

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_zadd`

Add one or more members to a sorted set with scores

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_zcard`

Get the number of members in a sorted set

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_zcount`

Count members in score range

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_zincrby`

Increment score of member in sorted set

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_zinterstore`

Intersect sorted sets and store result

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_zrange`

Get a range of members from a sorted set by index

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_zrangebyscore`

Get members in sorted set by score range

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_zrank`

Get the rank of a member in a sorted set

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_zrem`

Remove one or more members from a sorted set

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_zscan`

Incrementally iterate sorted set members

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_zscore`

Get the score of a member in a sorted set

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

### 🟡 `redis_zunionstore`

Union sorted sets and store result

**Tags:** `database`  
**Danger Level:** `caution`  
**Subcategory:** None


---

[← Back to Overview](README.md)
