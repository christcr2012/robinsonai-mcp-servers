/**
 * Coordination Tools for Robinson's Toolkit
 * 
 * Provides distributed coordination using Redis queue.
 * Prevents multiple agents/crawlers from working on same resources.
 */

import { getRedisQueue, Task } from './redis-queue.js';
import { randomUUID } from 'crypto';

export const coordinationTools = [
  {
    name: 'push_task',
    description: 'Add a task to the distributed queue. Other workers can claim it. Prevents duplicate work.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        task_type: {
          type: 'string',
          enum: ['crawl', 'code_generation', 'analysis', 'refactor', 'custom'],
          description: 'Type of task'
        },
        resource: {
          type: 'string',
          description: 'Resource identifier (URL, file path, etc.)'
        },
        tenant_id: {
          type: 'string',
          description: 'Tenant ID (for multi-tenant systems)'
        },
        priority: {
          type: 'number',
          description: 'Priority 1-10 (higher = more important)',
          minimum: 1,
          maximum: 10
        },
        params: {
          type: 'object',
          description: 'Task parameters'
        }
      },
      required: ['task_type', 'resource', 'priority']
    }
  },
  {
    name: 'claim_task',
    description: 'Claim the highest priority task from queue. Returns null if queue is empty.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        worker_id: {
          type: 'string',
          description: 'Unique worker identifier'
        }
      },
      required: ['worker_id']
    }
  },
  {
    name: 'complete_task',
    description: 'Mark a task as completed with optional result.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        task_id: {
          type: 'string',
          description: 'Task ID to complete'
        },
        result: {
          type: 'object',
          description: 'Task result (optional)'
        }
      },
      required: ['task_id']
    }
  },
  {
    name: 'fail_task',
    description: 'Mark a task as failed with error message.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        task_id: {
          type: 'string',
          description: 'Task ID to fail'
        },
        error: {
          type: 'string',
          description: 'Error message'
        }
      },
      required: ['task_id', 'error']
    }
  },
  {
    name: 'acquire_lock',
    description: 'Acquire exclusive lock on a resource. Prevents other workers from accessing it.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        resource: {
          type: 'string',
          description: 'Resource to lock (URL, file path, etc.)'
        },
        worker_id: {
          type: 'string',
          description: 'Worker ID acquiring the lock'
        },
        ttl_seconds: {
          type: 'number',
          description: 'Lock timeout in seconds (default: 300)',
          default: 300
        }
      },
      required: ['resource', 'worker_id']
    }
  },
  {
    name: 'release_lock',
    description: 'Release lock on a resource. Only works if you own the lock.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        resource: {
          type: 'string',
          description: 'Resource to unlock'
        },
        worker_id: {
          type: 'string',
          description: 'Worker ID releasing the lock'
        }
      },
      required: ['resource', 'worker_id']
    }
  },
  {
    name: 'check_lock',
    description: 'Check if a resource is locked and get lock info.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        resource: {
          type: 'string',
          description: 'Resource to check'
        }
      },
      required: ['resource']
    }
  },
  {
    name: 'get_queue_stats',
    description: 'Get statistics about the task queue.',
    inputSchema: {
      type: 'object' as const,
      properties: {}
    }
  }
];

/**
 * Handle coordination tool calls
 */
export async function handleCoordinationTool(name: string, args: any): Promise<any> {
  const queue = getRedisQueue();

  switch (name) {
    case 'push_task': {
      const task: Task = {
        task_id: randomUUID(),
        task_type: args.task_type,
        resource: args.resource,
        tenant_id: args.tenant_id,
        priority: args.priority,
        params: args.params || {},
        created_at: new Date().toISOString()
      };

      await queue.pushTask(task);

      return {
        success: true,
        task_id: task.task_id,
        message: `Task queued with priority ${task.priority}`
      };
    }

    case 'claim_task': {
      const task = await queue.popTask(args.worker_id);

      if (!task) {
        return {
          success: false,
          message: 'No tasks available in queue'
        };
      }

      return {
        success: true,
        task
      };
    }

    case 'complete_task': {
      await queue.completeTask(args.task_id, args.result);

      return {
        success: true,
        message: `Task ${args.task_id} marked as completed`
      };
    }

    case 'fail_task': {
      await queue.failTask(args.task_id, args.error);

      return {
        success: true,
        message: `Task ${args.task_id} marked as failed`
      };
    }

    case 'acquire_lock': {
      const acquired = await queue.acquireLock(
        args.resource,
        args.worker_id,
        args.ttl_seconds || 300
      );

      return {
        success: acquired,
        message: acquired
          ? `Lock acquired on ${args.resource}`
          : `Resource ${args.resource} is already locked`
      };
    }

    case 'release_lock': {
      const released = await queue.releaseLock(args.resource, args.worker_id);

      return {
        success: released,
        message: released
          ? `Lock released on ${args.resource}`
          : `Could not release lock (not owned or doesn't exist)`
      };
    }

    case 'check_lock': {
      const lockInfo = await queue.getLockInfo(args.resource);

      if (!lockInfo) {
        return {
          locked: false,
          message: `Resource ${args.resource} is not locked`
        };
      }

      return {
        locked: true,
        lock_info: lockInfo
      };
    }

    case 'get_queue_stats': {
      const stats = await queue.getStats();

      return {
        success: true,
        stats
      };
    }

    default:
      throw new Error(`Unknown coordination tool: ${name}`);
  }
}

