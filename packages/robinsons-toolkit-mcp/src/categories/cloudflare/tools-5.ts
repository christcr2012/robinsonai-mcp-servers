/**
 * Cloudflare Tool Definitions Part 5
 * D1 (continued), Queues, Durable Objects, Stream
 */

export const CLOUDFLARE_TOOLS_5 = [
  // ============================================================
  // D1 (SQL Database) - 10 more tools
  // ============================================================
  {
    name: 'cloudflare_export_d1_database',
    description: 'Export a D1 database',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        databaseId: { type: 'string', description: 'Database ID' },
        format: { type: 'string', description: 'Export format (sql, json)' },
      },
      required: ['accountId', 'databaseId'],
    },
  },
  {
    name: 'cloudflare_import_d1_database',
    description: 'Import data into a D1 database',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        databaseId: { type: 'string', description: 'Database ID' },
        data: { type: 'string', description: 'Data to import' },
        format: { type: 'string', description: 'Import format (sql, json)' },
      },
      required: ['accountId', 'databaseId', 'data'],
    },
  },
  {
    name: 'cloudflare_get_d1_database_size',
    description: 'Get size information for a D1 database',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        databaseId: { type: 'string', description: 'Database ID' },
      },
      required: ['accountId', 'databaseId'],
    },
  },
  {
    name: 'cloudflare_list_d1_tables',
    description: 'List tables in a D1 database',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        databaseId: { type: 'string', description: 'Database ID' },
      },
      required: ['accountId', 'databaseId'],
    },
  },
  {
    name: 'cloudflare_get_d1_table_schema',
    description: 'Get schema for a table',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        databaseId: { type: 'string', description: 'Database ID' },
        tableName: { type: 'string', description: 'Table name' },
      },
      required: ['accountId', 'databaseId', 'tableName'],
    },
  },
  {
    name: 'cloudflare_backup_d1_database',
    description: 'Create a backup of a D1 database',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        databaseId: { type: 'string', description: 'Database ID' },
      },
      required: ['accountId', 'databaseId'],
    },
  },
  {
    name: 'cloudflare_restore_d1_database',
    description: 'Restore a D1 database from backup',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        databaseId: { type: 'string', description: 'Database ID' },
        backupId: { type: 'string', description: 'Backup ID' },
      },
      required: ['accountId', 'databaseId', 'backupId'],
    },
  },
  {
    name: 'cloudflare_list_d1_backups',
    description: 'List backups for a D1 database',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        databaseId: { type: 'string', description: 'Database ID' },
      },
      required: ['accountId', 'databaseId'],
    },
  },
  {
    name: 'cloudflare_delete_d1_backup',
    description: 'Delete a D1 database backup',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        databaseId: { type: 'string', description: 'Database ID' },
        backupId: { type: 'string', description: 'Backup ID' },
      },
      required: ['accountId', 'databaseId', 'backupId'],
    },
  },
  {
    name: 'cloudflare_get_d1_usage',
    description: 'Get usage statistics for D1',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        databaseId: { type: 'string', description: 'Database ID' },
      },
      required: ['accountId', 'databaseId'],
    },
  },

  // ============================================================
  // QUEUES (Message Queues) - 10 tools
  // ============================================================
  {
    name: 'cloudflare_list_queues',
    description: 'List message queues',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
      },
      required: ['accountId'],
    },
  },
  {
    name: 'cloudflare_create_queue',
    description: 'Create a message queue',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        name: { type: 'string', description: 'Queue name' },
      },
      required: ['accountId', 'name'],
    },
  },
  {
    name: 'cloudflare_get_queue',
    description: 'Get a message queue',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        queueId: { type: 'string', description: 'Queue ID' },
      },
      required: ['accountId', 'queueId'],
    },
  },
  {
    name: 'cloudflare_delete_queue',
    description: 'Delete a message queue',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        queueId: { type: 'string', description: 'Queue ID' },
      },
      required: ['accountId', 'queueId'],
    },
  },
  {
    name: 'cloudflare_send_queue_message',
    description: 'Send a message to a queue',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        queueId: { type: 'string', description: 'Queue ID' },
        body: { type: 'string', description: 'Message body' },
        contentType: { type: 'string', description: 'Content type' },
      },
      required: ['accountId', 'queueId', 'body'],
    },
  },
  {
    name: 'cloudflare_receive_queue_messages',
    description: 'Receive messages from a queue',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        queueId: { type: 'string', description: 'Queue ID' },
        maxMessages: { type: 'number', description: 'Max messages to receive' },
        visibilityTimeout: { type: 'number', description: 'Visibility timeout in seconds' },
      },
      required: ['accountId', 'queueId'],
    },
  },
  {
    name: 'cloudflare_ack_queue_message',
    description: 'Acknowledge a queue message',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        queueId: { type: 'string', description: 'Queue ID' },
        receiptHandle: { type: 'string', description: 'Receipt handle' },
      },
      required: ['accountId', 'queueId', 'receiptHandle'],
    },
  },
  {
    name: 'cloudflare_get_queue_stats',
    description: 'Get statistics for a queue',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        queueId: { type: 'string', description: 'Queue ID' },
      },
      required: ['accountId', 'queueId'],
    },
  },
  {
    name: 'cloudflare_purge_queue',
    description: 'Purge all messages from a queue',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        queueId: { type: 'string', description: 'Queue ID' },
      },
      required: ['accountId', 'queueId'],
    },
  },
  {
    name: 'cloudflare_update_queue_settings',
    description: 'Update queue settings',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        queueId: { type: 'string', description: 'Queue ID' },
        settings: { type: 'object', description: 'Queue settings' },
      },
      required: ['accountId', 'queueId', 'settings'],
    },
  },

  // ============================================================
  // DURABLE OBJECTS - 10 tools
  // ============================================================
  {
    name: 'cloudflare_list_durable_objects_namespaces',
    description: 'List Durable Objects namespaces',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
      },
      required: ['accountId'],
    },
  },
  {
    name: 'cloudflare_create_durable_objects_namespace',
    description: 'Create a Durable Objects namespace',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        name: { type: 'string', description: 'Namespace name' },
        scriptName: { type: 'string', description: 'Worker script name' },
        className: { type: 'string', description: 'Class name' },
      },
      required: ['accountId', 'name', 'scriptName', 'className'],
    },
  },
  {
    name: 'cloudflare_get_durable_objects_namespace',
    description: 'Get a Durable Objects namespace',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
      },
      required: ['accountId', 'namespaceId'],
    },
  },
  {
    name: 'cloudflare_delete_durable_objects_namespace',
    description: 'Delete a Durable Objects namespace',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
      },
      required: ['accountId', 'namespaceId'],
    },
  },
  {
    name: 'cloudflare_list_durable_objects',
    description: 'List Durable Objects in a namespace',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
      },
      required: ['accountId', 'namespaceId'],
    },
  },
  {
    name: 'cloudflare_get_durable_object',
    description: 'Get a specific Durable Object',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
        objectId: { type: 'string', description: 'Object ID' },
      },
      required: ['accountId', 'namespaceId', 'objectId'],
    },
  },
  {
    name: 'cloudflare_delete_durable_object',
    description: 'Delete a Durable Object',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
        objectId: { type: 'string', description: 'Object ID' },
      },
      required: ['accountId', 'namespaceId', 'objectId'],
    },
  },
  {
    name: 'cloudflare_get_durable_object_alarms',
    description: 'Get alarms for a Durable Object',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
        objectId: { type: 'string', description: 'Object ID' },
      },
      required: ['accountId', 'namespaceId', 'objectId'],
    },
  },
  {
    name: 'cloudflare_get_durable_objects_usage',
    description: 'Get usage statistics for Durable Objects',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
      },
      required: ['accountId', 'namespaceId'],
    },
  },
  {
    name: 'cloudflare_migrate_durable_objects',
    description: 'Migrate Durable Objects to a new class',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
        newClassName: { type: 'string', description: 'New class name' },
      },
      required: ['accountId', 'namespaceId', 'newClassName'],
    },
  },

  // ============================================================
  // STREAM (Video) - 15 tools
  // ============================================================
  {
    name: 'cloudflare_list_stream_videos',
    description: 'List Stream videos',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        search: { type: 'string', description: 'Search query' },
        status: { type: 'string', description: 'Filter by status' },
      },
      required: ['accountId'],
    },
  },
  {
    name: 'cloudflare_get_stream_video',
    description: 'Get a Stream video',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        videoId: { type: 'string', description: 'Video ID' },
      },
      required: ['accountId', 'videoId'],
    },
  },
  {
    name: 'cloudflare_upload_stream_video',
    description: 'Upload a video to Stream',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        file: { type: 'string', description: 'Video file path or URL' },
        meta: { type: 'object', description: 'Video metadata' },
      },
      required: ['accountId', 'file'],
    },
  },
  {
    name: 'cloudflare_delete_stream_video',
    description: 'Delete a Stream video',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        videoId: { type: 'string', description: 'Video ID' },
      },
      required: ['accountId', 'videoId'],
    },
  },
  {
    name: 'cloudflare_update_stream_video',
    description: 'Update Stream video metadata',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        videoId: { type: 'string', description: 'Video ID' },
        meta: { type: 'object', description: 'Updated metadata' },
      },
      required: ['accountId', 'videoId', 'meta'],
    },
  },
  {
    name: 'cloudflare_get_stream_video_embed',
    description: 'Get embed code for a Stream video',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        videoId: { type: 'string', description: 'Video ID' },
      },
      required: ['accountId', 'videoId'],
    },
  },
  {
    name: 'cloudflare_create_stream_live_input',
    description: 'Create a live input for streaming',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        meta: { type: 'object', description: 'Live input metadata' },
        recording: { type: 'object', description: 'Recording settings' },
      },
      required: ['accountId'],
    },
  },
  {
    name: 'cloudflare_list_stream_live_inputs',
    description: 'List Stream live inputs',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
      },
      required: ['accountId'],
    },
  },
  {
    name: 'cloudflare_get_stream_live_input',
    description: 'Get a Stream live input',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        liveInputId: { type: 'string', description: 'Live input ID' },
      },
      required: ['accountId', 'liveInputId'],
    },
  },
  {
    name: 'cloudflare_delete_stream_live_input',
    description: 'Delete a Stream live input',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        liveInputId: { type: 'string', description: 'Live input ID' },
      },
      required: ['accountId', 'liveInputId'],
    },
  },
  {
    name: 'cloudflare_get_stream_analytics',
    description: 'Get analytics for Stream videos',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        videoId: { type: 'string', description: 'Video ID (optional)' },
        since: { type: 'string', description: 'Start time' },
        until: { type: 'string', description: 'End time' },
      },
      required: ['accountId'],
    },
  },
  {
    name: 'cloudflare_create_stream_webhook',
    description: 'Create a webhook for Stream events',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        notificationUrl: { type: 'string', description: 'Webhook URL' },
      },
      required: ['accountId', 'notificationUrl'],
    },
  },
  {
    name: 'cloudflare_list_stream_webhooks',
    description: 'List Stream webhooks',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
      },
      required: ['accountId'],
    },
  },
  {
    name: 'cloudflare_delete_stream_webhook',
    description: 'Delete a Stream webhook',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        webhookId: { type: 'string', description: 'Webhook ID' },
      },
      required: ['accountId', 'webhookId'],
    },
  },
  {
    name: 'cloudflare_download_stream_video',
    description: 'Download a Stream video',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        videoId: { type: 'string', description: 'Video ID' },
      },
      required: ['accountId', 'videoId'],
    },
  },
];

