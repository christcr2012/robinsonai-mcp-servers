/**
 * Upstash (Redis) Handler Functions
 * Extracted from temp-redis-mcp.ts
 * Total: 80 handlers
 */

import { createClient, RedisClientType } from 'redis';

// Module-level client singleton
let clientInstance: RedisClientType | null = null;
let isConnected = false;
let currentDb: 'provider' | 'tenant' = 'provider';

function getRedisUrl(): string {
  const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || '';
  if (!url) {
    throw new Error('REDIS_URL or UPSTASH_REDIS_URL environment variable is required');
  }
  return url;
}

async function getRedisClient(): Promise<RedisClientType> {
  if (!clientInstance) {
    clientInstance = createClient({ url: getRedisUrl() });
    clientInstance.on('error', (err) => console.error('Redis Client Error', err));
  }
  if (!isConnected) {
    await clientInstance.connect();
    isConnected = true;
  }
  return clientInstance;
}

  export async function redisget(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = await redisClient.get(args.key);
    return {
      content: [
        {
          type: "text",
          text: value !== null ? value : `Key "${args.key}" not found`,
        },
      ],
    };
  }

  export async function redisset(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    if (args.ttl) {
      await redisClient.setEx(args.key, args.ttl, args.value);
    } else {
      await redisClient.set(args.key, args.value);
    }
    return {
      content: [
        {
          type: "text",
          text: `Set ${args.key}${args.ttl ? ` with TTL ${args.ttl}s` : ""}`,
        },
      ],
    };
  }

  export async function redisdelete(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await redisClient.del(args.keys);
    return {
      content: [{ type: "text", text: `Deleted ${count} key(s)` }],
    };
  }

  export async function redisexists(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await redisClient.exists(args.keys);
    return {
      content: [
        {
          type: "text",
          text: `${count} of ${args.keys.length} key(s) exist`,
        },
      ],
    };
  }

  export async function redisttl(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const ttl = await redisClient.ttl(args.key);
    let message: string;
    if (ttl === -2) message = `Key "${args.key}" does not exist`;
    else if (ttl === -1) message = `Key "${args.key}" has no expiration`;
    else message = `TTL: ${ttl} seconds`;

    return { content: [{ type: "text", text: message }] };
  }

  export async function redisexpire(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await redisClient.expire(args.key, args.seconds);
    return {
      content: [
        {
          type: "text",
          text: result
            ? `Set expiration for ${args.key} to ${args.seconds}s`
            : `Key "${args.key}" not found`,
        },
      ],
    };
  }

  export async function redislistKeys(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const pattern = args.pattern || "*";
    const limit = args.limit || 100;
    const keys: string[] = [];

    for await (const key of redisClient.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      keys.push(key);
      if (keys.length >= limit) break;
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${keys.length} key(s):\n${keys.join("\n")}`,
        },
      ],
    };
  }

  export async function redisdeleteByPattern(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    if (!args.confirm) {
      return {
        content: [
          {
            type: "text",
            text: "Deletion cancelled. Set confirm=true to proceed.",
          },
        ],
      };
    }

    const keys: string[] = [];
    for await (const key of redisClient.scanIterator({
      MATCH: args.pattern,
      COUNT: 100,
    })) {
      keys.push(key);
    }

    if (keys.length === 0) {
      return {
        content: [
          { type: "text", text: `No keys found matching pattern "${args.pattern}"` },
        ],
      };
    }

    const count = await redisClient.del(keys);
    return {
      content: [
        {
          type: "text",
          text: `Deleted ${count} key(s) matching pattern "${args.pattern}"`,
        },
      ],
    };
  }

  export async function redisMget(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const values = await redisClient.mget(args.keys);
    const results = args.keys.map((key: string, i: number) => ({
      key,
      value: values[i],
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  export async function redisinfo(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const info = await redisClient.info(args.section);
    return { content: [{ type: "text", text: info }] };
  }

  export async function redisdbsize(): Promise<{ content: Array<{ type: string; text: string }> }> {
    const size = await redisClient.dbSize();
    return {
      content: [{ type: "text", text: `Database contains ${size} keys` }],
    };
  }

  export async function redismemoryUsage(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const memory = await redisClient.memoryUsage(args.key);
    return {
      content: [
        {
          type: "text",
          text: memory
            ? `Memory usage: ${memory} bytes`
            : `Key "${args.key}" not found`,
        },
      ],
    };
  }

  export async function redislistSessions(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const pattern = args.tenant_id
      ? `session:${args.tenant_id}:*`
      : "session:*";
    const limit = args.limit || 50;
    const sessions: string[] = [];

    for await (const key of redisClient.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      sessions.push(key);
      if (sessions.length >= limit) break;
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${sessions.length} session(s):\n${sessions.join("\n")}`,
        },
      ],
    };
  }

  export async function redisinspectSession(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const key = args.session_id.startsWith("session:")
      ? args.session_id
      : `session:${args.session_id}`;
    const value = await redisClient.get(key);
    const ttl = await redisClient.ttl(key);

    if (!value) {
      return {
        content: [{ type: "text", text: `Session "${args.session_id}" not found` }],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Session: ${key}\nTTL: ${ttl}s\nData:\n${value}`,
        },
      ],
    };
  }

  export async function redisclearTenantCache(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    if (!args.confirm) {
      return {
        content: [
          {
            type: "text",
            text: "Cache clear cancelled. Set confirm=true to proceed.",
          },
        ],
      };
    }

    const pattern = `*:${args.tenant_id}:*`;
    const keys: string[] = [];

    for await (const key of redisClient.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      keys.push(key);
    }

    if (keys.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No cache entries found for tenant "${args.tenant_id}"`,
          },
        ],
      };
    }

    const count = await redisClient.del(keys);
    return {
      content: [
        {
          type: "text",
          text: `Cleared ${count} cache entries for tenant "${args.tenant_id}"`,
        },
      ],
    };
  }

  export async function redislistRateLimits(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const pattern = args.user_id
      ? `ratelimit:${args.user_id}:*`
      : "ratelimit:*";
    const limit = args.limit || 50;
    const rateLimits: string[] = [];

    for await (const key of redisClient.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      rateLimits.push(key);
      if (rateLimits.length >= limit) break;
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${rateLimits.length} rate limit(s):\n${rateLimits.join("\n")}`,
        },
      ],
    };
  }

  export async function rediscurrentDb(): Promise<{ content: Array<{ type: string; text: string }> }> {
    return {
      content: [
        {
          type: "text",
          text: `Current database: ${currentDb}\nConnection: ${getRedisUrl()}`,
        },
      ],
    };
  }

  export async function redisflushDb(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    if (!args.confirm) {
      return {
        content: [
          {
            type: "text",
            text: "Flush cancelled. Set confirm=true to proceed. WARNING: This will delete ALL keys!",
          },
        ],
      };
    }

    await redisClient.flushDb();
    return {
      content: [
        { type: "text", text: "Database flushed. All keys have been deleted." },
      ],
    };
  }

  export async function redisincr(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = await redisClient.incr(args.key);
    return { content: [{ type: "text", text: `Incremented ${args.key} to ${value}` }] };
  }

  export async function redisdecr(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = await redisClient.decr(args.key);
    return { content: [{ type: "text", text: `Decremented ${args.key} to ${value}` }] };
  }

  export async function redisincrby(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = await redisClient.incrBy(args.key, args.increment);
    return { content: [{ type: "text", text: `Incremented ${args.key} by ${args.increment} to ${value}` }] };
  }

  export async function redisdecrby(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = await redisClient.decrBy(args.key, args.decrement);
    return { content: [{ type: "text", text: `Decremented ${args.key} by ${args.decrement} to ${value}` }] };
  }

  export async function redisappend(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await redisClient.append(args.key, args.value);
    return { content: [{ type: "text", text: `Appended to ${args.key}, new length: ${length}` }] };
  }

  export async function redisstrlen(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await redisClient.strLen(args.key);
    return { content: [{ type: "text", text: `Length of ${args.key}: ${length}` }] };
  }

  export async function redisHset(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await redisClient.hset(args.key, args.field, args.value);
    return { content: [{ type: "text", text: `Set ${args.field} in hash ${args.key}` }] };
  }

  export async function redisHget(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = await redisClient.hget(args.key, args.field);
    return { content: [{ type: "text", text: value !== undefined ? value : `Field ${args.field} not found in ${args.key}` }] };
  }

  export async function redishgetall(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const hash = await redisClient.hGetAll(args.key);
    return { content: [{ type: "text", text: JSON.stringify(hash, null, 2) }] };
  }

  export async function redishdel(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await redisClient.hDel(args.key, args.fields);
    return { content: [{ type: "text", text: `Deleted ${count} field(s) from hash ${args.key}` }] };
  }

  export async function redisHexists(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const exists = await redisClient.hexists(args.key, args.field);
    return { content: [{ type: "text", text: `Field ${args.field} ${exists ? 'exists' : 'does not exist'} in ${args.key}` }] };
  }

  export async function redishkeys(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const keys = await redisClient.hKeys(args.key);
    return { content: [{ type: "text", text: JSON.stringify(keys, null, 2) }] };
  }

  export async function redishvals(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const values = await redisClient.hVals(args.key);
    return { content: [{ type: "text", text: JSON.stringify(values, null, 2) }] };
  }

  export async function redishlen(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await redisClient.hLen(args.key);
    return { content: [{ type: "text", text: `Hash ${args.key} has ${length} field(s)` }] };
  }

  export async function redislpush(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await redisClient.lPush(args.key, args.values);
    return { content: [{ type: "text", text: `Prepended ${args.values.length} value(s) to list ${args.key}, new length: ${length}` }] };
  }

  export async function redisrpush(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await redisClient.rPush(args.key, args.values);
    return { content: [{ type: "text", text: `Appended ${args.values.length} value(s) to list ${args.key}, new length: ${length}` }] };
  }

  export async function redislpop(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = args.count ? await redisClient.lPop(args.key, args.count) : await redisClient.lPop(args.key);
    return { content: [{ type: "text", text: value ? JSON.stringify(value) : `List ${args.key} is empty` }] };
  }

  export async function redisrpop(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = args.count ? await redisClient.rPop(args.key, args.count) : await redisClient.rPop(args.key);
    return { content: [{ type: "text", text: value ? JSON.stringify(value) : `List ${args.key} is empty` }] };
  }

  export async function redislrange(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const values = await redisClient.lRange(args.key, args.start, args.stop);
    return { content: [{ type: "text", text: JSON.stringify(values, null, 2) }] };
  }

  export async function redisllen(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await redisClient.lLen(args.key);
    return { content: [{ type: "text", text: `List ${args.key} has ${length} element(s)` }] };
  }

  export async function redissadd(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await redisClient.sAdd(args.key, args.members);
    return { content: [{ type: "text", text: `Added ${count} member(s) to set ${args.key}` }] };
  }

  export async function redissmembers(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const members = await redisClient.sMembers(args.key);
    return { content: [{ type: "text", text: JSON.stringify(members, null, 2) }] };
  }

  export async function redissrem(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await redisClient.sRem(args.key, args.members);
    return { content: [{ type: "text", text: `Removed ${count} member(s) from set ${args.key}` }] };
  }

  export async function redissismember(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const isMember = await redisClient.sIsMember(args.key, args.member);
    return { content: [{ type: "text", text: `${args.member} ${isMember ? 'is' : 'is not'} a member of ${args.key}` }] };
  }

  export async function redisscard(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await redisClient.sCard(args.key);
    return { content: [{ type: "text", text: `Set ${args.key} has ${count} member(s)` }] };
  }

  export async function rediszadd(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const members = args.members.map((m: any) => ({ score: m.score, value: m.value }));
    const count = await redisClient.zAdd(args.key, members);
    return { content: [{ type: "text", text: `Added ${count} member(s) to sorted set ${args.key}` }] };
  }

  export async function rediszrange(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const members = args.withScores
      ? await redisClient.zRangeWithScores(args.key, args.start, args.stop)
      : await redisClient.zRange(args.key, args.start, args.stop);
    return { content: [{ type: "text", text: JSON.stringify(members, null, 2) }] };
  }

  export async function rediszrem(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await redisClient.zRem(args.key, args.members);
    return { content: [{ type: "text", text: `Removed ${count} member(s) from sorted set ${args.key}` }] };
  }

  export async function rediszscore(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const score = await redisClient.zScore(args.key, args.member);
    return { content: [{ type: "text", text: score !== null ? `Score: ${score}` : `Member ${args.member} not found in ${args.key}` }] };
  }

  export async function rediszcard(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await redisClient.zCard(args.key);
    return { content: [{ type: "text", text: `Sorted set ${args.key} has ${count} member(s)` }] };
  }

  export async function rediszrank(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const rank = await redisClient.zRank(args.key, args.member);
    return { content: [{ type: "text", text: rank !== null ? `Rank: ${rank}` : `Member ${args.member} not found in ${args.key}` }] };
  }

  export async function redistype(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const type = await redisClient.type(args.key);
    return { content: [{ type: "text", text: `Type of ${args.key}: ${type}` }] };
  }

  export async function redisrename(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await redisClient.rename(args.oldKey, args.newKey);
    return { content: [{ type: "text", text: `Renamed ${args.oldKey} to ${args.newKey}` }] };
  }

  export async function redispersist(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await redisClient.persist(args.key);
    return { content: [{ type: "text", text: result ? `Removed expiration from ${args.key}` : `${args.key} does not have an expiration` }] };
  }

  export async function redisxadd(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const id = await redisClient.xAdd(args.key, args.id, args.fields);
    return { content: [{ type: "text", text: `Added entry to stream ${args.key} with ID: ${id}` }] };
  }

  export async function redisxread(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const options: any = {};
    if (args.count) options.COUNT = args.count;
    if (args.block !== undefined) options.BLOCK = args.block;
    const result = await redisClient.xRead(args.streams, options);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  export async function redisxrange(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await redisClient.xRange(args.key, args.start, args.end, args.count ? { COUNT: args.count } : undefined);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  export async function redisxlen(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await redisClient.xLen(args.key);
    return { content: [{ type: "text", text: `Stream ${args.key} length: ${length}` }] };
  }

  export async function redisgeoadd(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await redisClient.geoAdd(args.key, args.members);
    return { content: [{ type: "text", text: `Added ${count} geospatial items to ${args.key}` }] };
  }

  export async function redisgeodist(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const distance = await redisClient.geoDist(args.key, args.member1, args.member2, args.unit || 'm');
    return { content: [{ type: "text", text: `Distance: ${distance} ${args.unit || 'm'}` }] };
  }

  export async function redisgeoradius(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await redisClient.geoRadius(args.key, { longitude: args.longitude, latitude: args.latitude }, args.radius, args.unit);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  export async function redispfadd(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await redisClient.pfAdd(args.key, args.elements);
    return { content: [{ type: "text", text: `PfAdd result: ${result}` }] };
  }

  export async function redispfcount(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await redisClient.pfCount(args.keys);
    return { content: [{ type: "text", text: `Cardinality: ${count}` }] };
  }

  export async function redissetbit(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const oldValue = await redisClient.setBit(args.key, args.offset, args.value);
    return { content: [{ type: "text", text: `Set bit at offset ${args.offset}, old value: ${oldValue}` }] };
  }

  export async function redisgetbit(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = await redisClient.getBit(args.key, args.offset);
    return { content: [{ type: "text", text: `Bit value at offset ${args.offset}: ${value}` }] };
  }

  export async function redisbitcount(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await redisClient.bitCount(args.key, args.start, args.end);
    return { content: [{ type: "text", text: `Bit count: ${count}` }] };
  }

  export async function rediszrangebyscore(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const options: any = {};
    if (args.withscores) options.WITHSCORES = true;
    const result = await redisClient.zRangeByScore(args.key, args.min, args.max, options);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  export async function redisZincrby(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const newScore = await redisClient.zincrby(args.key, args.increment, args.member);
    return { content: [{ type: "text", text: `New score for ${args.member}: ${newScore}` }] };
  }

  export async function rediszcount(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await redisClient.zCount(args.key, args.min, args.max);
    return { content: [{ type: "text", text: `Count in range: ${count}` }] };
  }

  export async function redisscan(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const options: any = {};
    if (args.match) options.MATCH = args.match;
    if (args.count) options.COUNT = args.count;
    const result = await redisClient.scan(parseInt(args.cursor), options);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  export async function redisHscan(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const options: any = {};
    if (args.match) options.MATCH = args.match;
    if (args.count) options.COUNT = args.count;
    const result = await redisClient.hscan(args.key, parseInt(args.cursor), options);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  export async function redisSscan(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const options: any = {};
    if (args.match) options.MATCH = args.match;
    if (args.count) options.COUNT = args.count;
    const result = await redisClient.sscan(args.key, parseInt(args.cursor), options);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  export async function redisZscan(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const options: any = {};
    if (args.match) options.MATCH = args.match;
    if (args.count) options.COUNT = args.count;
    const result = await redisClient.zscan(args.key, parseInt(args.cursor), options);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  export async function redisgetrange(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = await redisClient.getRange(args.key, args.start, args.end);
    return { content: [{ type: "text", text: value }] };
  }

  export async function redissetrange(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await redisClient.setRange(args.key, args.offset, args.value);
    return { content: [{ type: "text", text: `String length after modification: ${length}` }] };
  }

  export async function redissinter(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await redisClient.sInter(args.keys);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  export async function redissunion(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await redisClient.sUnion(args.keys);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  export async function redissdiff(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await redisClient.sDiff(args.keys);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  export async function rediszunionstore(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const options: any = { KEYS: args.keys };
    if (args.weights) options.WEIGHTS = args.weights;
    const count = await redisClient.zUnionStore(args.destination, args.keys, options);
    return { content: [{ type: "text", text: `Stored ${count} members in ${args.destination}` }] };
  }

  export async function rediszinterstore(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const options: any = { KEYS: args.keys };
    if (args.weights) options.WEIGHTS = args.weights;
    const count = await redisClient.zInterStore(args.destination, args.keys, options);
    return { content: [{ type: "text", text: `Stored ${count} members in ${args.destination}` }] };
  }

  export async function redislinsert(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await redisClient.lInsert(args.key, args.position, args.pivot, args.element);
    return { content: [{ type: "text", text: `List length after insert: ${length}` }] };
  }

  export async function redispublish(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await redisClient.publish(args.channel, args.message);
    return { content: [{ type: "text", text: `Published message to ${args.channel}, received by ${count} subscriber(s)` }] };
  }

