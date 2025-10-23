/**
 * Redis Task Queue for Distributed Coordination
 * 
 * Prevents multiple agents/crawlers from working on the same thing.
 * Uses Cloudflare Redis (or any Redis instance).
 */

import { createClient, RedisClientType } from 'redis';

export interface Task {
  task_id: string;
  task_type: 'crawl' | 'code_generation' | 'analysis' | 'refactor' | 'custom';
  resource: string; // URL, file path, or resource identifier
  tenant_id?: string;
  priority: number; // 1-10, higher = more important
  params: any;
  created_at: string;
  claimed_by?: string;
  claimed_at?: string;
}

export interface TaskLock {
  lock_id: string;
  resource: string;
  locked_by: string;
  locked_at: string;
  expires_at: string;
}

export class RedisQueue {
  private client: RedisClientType;
  private connected: boolean = false;

  constructor(private redisUrl: string) {
    this.client = createClient({ url: redisUrl }) as RedisClientType;
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect();
      this.connected = false;
    }
  }

  /**
   * Push task to queue
   */
  async pushTask(task: Task): Promise<void> {
    await this.connect();

    // Store task data
    await this.client.hSet(`task:${task.task_id}`, {
      task_id: task.task_id,
      task_type: task.task_type,
      resource: task.resource,
      tenant_id: task.tenant_id || '',
      priority: task.priority.toString(),
      params: JSON.stringify(task.params),
      created_at: task.created_at,
      status: 'queued'
    });

    // Add to priority queue (sorted set by priority)
    await this.client.zAdd('task_queue', {
      score: task.priority,
      value: task.task_id
    });
  }

  /**
   * Pop highest priority task from queue
   */
  async popTask(workerId: string): Promise<Task | null> {
    await this.connect();

    // Get highest priority task (atomic operation)
    const taskIds = await this.client.zPopMax('task_queue');
    if (!taskIds || !taskIds.value) {
      return null;
    }

    const taskId = taskIds.value;

    // Get task data
    const taskData = await this.client.hGetAll(`task:${taskId}`);
    if (!taskData || !taskData.task_id) {
      return null;
    }

    // Mark as claimed
    await this.client.hSet(`task:${taskId}`, {
      status: 'claimed',
      claimed_by: workerId,
      claimed_at: new Date().toISOString()
    });

    return {
      task_id: taskData.task_id,
      task_type: taskData.task_type as any,
      resource: taskData.resource,
      tenant_id: taskData.tenant_id || undefined,
      priority: parseInt(taskData.priority),
      params: JSON.parse(taskData.params),
      created_at: taskData.created_at,
      claimed_by: workerId,
      claimed_at: new Date().toISOString()
    };
  }

  /**
   * Acquire lock on a resource
   */
  async acquireLock(resource: string, workerId: string, ttlSeconds: number = 300): Promise<boolean> {
    await this.connect();

    const lockKey = `lock:${resource}`;
    const lockData = {
      locked_by: workerId,
      locked_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString()
    };

    // Try to set lock (NX = only if not exists)
    const result = await this.client.set(lockKey, JSON.stringify(lockData), {
      NX: true,
      EX: ttlSeconds
    });

    return result === 'OK';
  }

  /**
   * Release lock on a resource
   */
  async releaseLock(resource: string, workerId: string): Promise<boolean> {
    await this.connect();

    const lockKey = `lock:${resource}`;
    
    // Get current lock
    const lockDataStr = await this.client.get(lockKey);
    if (!lockDataStr) {
      return false; // No lock exists
    }

    const lockData = JSON.parse(lockDataStr);
    
    // Only release if we own the lock
    if (lockData.locked_by !== workerId) {
      return false;
    }

    await this.client.del(lockKey);
    return true;
  }

  /**
   * Check if resource is locked
   */
  async isLocked(resource: string): Promise<boolean> {
    await this.connect();

    const lockKey = `lock:${resource}`;
    const exists = await this.client.exists(lockKey);
    return exists === 1;
  }

  /**
   * Get lock info
   */
  async getLockInfo(resource: string): Promise<TaskLock | null> {
    await this.connect();

    const lockKey = `lock:${resource}`;
    const lockDataStr = await this.client.get(lockKey);
    
    if (!lockDataStr) {
      return null;
    }

    const lockData = JSON.parse(lockDataStr);
    return {
      lock_id: lockKey,
      resource,
      locked_by: lockData.locked_by,
      locked_at: lockData.locked_at,
      expires_at: lockData.expires_at
    };
  }

  /**
   * Mark task as complete
   */
  async completeTask(taskId: string, result?: any): Promise<void> {
    await this.connect();

    await this.client.hSet(`task:${taskId}`, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      result: result ? JSON.stringify(result) : ''
    });

    // Set expiry on completed task (clean up after 24 hours)
    await this.client.expire(`task:${taskId}`, 86400);
  }

  /**
   * Mark task as failed
   */
  async failTask(taskId: string, error: string): Promise<void> {
    await this.connect();

    await this.client.hSet(`task:${taskId}`, {
      status: 'failed',
      failed_at: new Date().toISOString(),
      error
    });

    // Set expiry on failed task (clean up after 24 hours)
    await this.client.expire(`task:${taskId}`, 86400);
  }

  /**
   * Get queue stats
   */
  async getStats(): Promise<{
    queued: number;
    claimed: number;
    completed: number;
    failed: number;
    locks: number;
  }> {
    await this.connect();

    const queued = await this.client.zCard('task_queue');
    
    // Count tasks by status (this is approximate - would need to scan all task:* keys for exact count)
    // For now, just return queue size
    return {
      queued,
      claimed: 0, // Would need to scan to get exact count
      completed: 0,
      failed: 0,
      locks: 0
    };
  }

  /**
   * Clear all tasks and locks (for testing/cleanup)
   */
  async clear(): Promise<void> {
    await this.connect();

    // Clear queue
    await this.client.del('task_queue');

    // Clear all task:* and lock:* keys
    const taskKeys = await this.client.keys('task:*');
    const lockKeys = await this.client.keys('lock:*');
    
    if (taskKeys.length > 0) {
      await this.client.del(taskKeys);
    }
    
    if (lockKeys.length > 0) {
      await this.client.del(lockKeys);
    }
  }
}

/**
 * Singleton instance
 */
let queue: RedisQueue | null = null;

export function getRedisQueue(redisUrl?: string): RedisQueue {
  if (!queue) {
    const url = redisUrl || process.env.REDIS_URL;
    if (!url) {
      throw new Error('REDIS_URL environment variable is required');
    }
    queue = new RedisQueue(url);
  }
  return queue;
}

