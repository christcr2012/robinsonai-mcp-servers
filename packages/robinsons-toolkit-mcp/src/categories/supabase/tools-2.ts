/**
 * Supabase Tool Definitions Part 2 (65 tools)
 * 
 * Resource Groups:
 * - Storage: 25 tools
 * - Realtime: 15 tools
 * - Edge Functions: 15 tools
 * - Management API: 10 tools
 */

export const SUPABASE_TOOLS_2 = [
  // ============================================================
  // STORAGE (25 tools)
  // ============================================================

  // BUCKETS (6 tools)
  {
    name: 'supabase_storage_create_bucket',
    description: 'Create a new storage bucket',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Bucket ID' },
        options: { type: 'object', description: 'Bucket options (public, fileSizeLimit, etc.)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'supabase_storage_get_bucket',
    description: 'Get bucket details',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Bucket ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'supabase_storage_list_buckets',
    description: 'List all storage buckets',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'supabase_storage_empty_bucket',
    description: 'Empty all files from a bucket',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Bucket ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'supabase_storage_delete_bucket',
    description: 'Delete a storage bucket',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Bucket ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'supabase_storage_update_bucket',
    description: 'Update bucket settings',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Bucket ID' },
        options: { type: 'object', description: 'Bucket options to update' },
      },
      required: ['id', 'options'],
    },
  },

  // OBJECTS (10 tools)
  {
    name: 'supabase_storage_upload',
    description: 'Upload a file to storage',
    inputSchema: {
      type: 'object',
      properties: {
        bucket: { type: 'string', description: 'Bucket ID' },
        path: { type: 'string', description: 'File path in bucket' },
        file: { description: 'File data (string, Buffer, or Blob)' },
        options: { type: 'object', description: 'Upload options (contentType, cacheControl, upsert, etc.)' },
      },
      required: ['bucket', 'path', 'file'],
    },
  },
  {
    name: 'supabase_storage_download',
    description: 'Download a file from storage',
    inputSchema: {
      type: 'object',
      properties: {
        bucket: { type: 'string', description: 'Bucket ID' },
        path: { type: 'string', description: 'File path in bucket' },
      },
      required: ['bucket', 'path'],
    },
  },
  {
    name: 'supabase_storage_list',
    description: 'List files in a bucket',
    inputSchema: {
      type: 'object',
      properties: {
        bucket: { type: 'string', description: 'Bucket ID' },
        path: { type: 'string', description: 'Folder path (optional)' },
        options: { type: 'object', description: 'List options (limit, offset, sortBy, etc.)' },
      },
      required: ['bucket'],
    },
  },
  {
    name: 'supabase_storage_move',
    description: 'Move a file to a new location',
    inputSchema: {
      type: 'object',
      properties: {
        bucket: { type: 'string', description: 'Bucket ID' },
        fromPath: { type: 'string', description: 'Source file path' },
        toPath: { type: 'string', description: 'Destination file path' },
      },
      required: ['bucket', 'fromPath', 'toPath'],
    },
  },
  {
    name: 'supabase_storage_copy',
    description: 'Copy a file to a new location',
    inputSchema: {
      type: 'object',
      properties: {
        bucket: { type: 'string', description: 'Bucket ID' },
        fromPath: { type: 'string', description: 'Source file path' },
        toPath: { type: 'string', description: 'Destination file path' },
      },
      required: ['bucket', 'fromPath', 'toPath'],
    },
  },
  {
    name: 'supabase_storage_remove',
    description: 'Remove files from storage',
    inputSchema: {
      type: 'object',
      properties: {
        bucket: { type: 'string', description: 'Bucket ID' },
        paths: { type: 'array', description: 'Array of file paths to remove' },
      },
      required: ['bucket', 'paths'],
    },
  },
  {
    name: 'supabase_storage_create_signed_url',
    description: 'Create a signed URL for temporary access',
    inputSchema: {
      type: 'object',
      properties: {
        bucket: { type: 'string', description: 'Bucket ID' },
        path: { type: 'string', description: 'File path' },
        expiresIn: { type: 'number', description: 'Expiration time in seconds' },
      },
      required: ['bucket', 'path', 'expiresIn'],
    },
  },
  {
    name: 'supabase_storage_create_signed_urls',
    description: 'Create signed URLs for multiple files',
    inputSchema: {
      type: 'object',
      properties: {
        bucket: { type: 'string', description: 'Bucket ID' },
        paths: { type: 'array', description: 'Array of file paths' },
        expiresIn: { type: 'number', description: 'Expiration time in seconds' },
      },
      required: ['bucket', 'paths', 'expiresIn'],
    },
  },
  {
    name: 'supabase_storage_get_public_url',
    description: 'Get public URL for a file',
    inputSchema: {
      type: 'object',
      properties: {
        bucket: { type: 'string', description: 'Bucket ID' },
        path: { type: 'string', description: 'File path' },
        options: { type: 'object', description: 'URL options (download, transform, etc.)' },
      },
      required: ['bucket', 'path'],
    },
  },
  {
    name: 'supabase_storage_update',
    description: 'Update file metadata',
    inputSchema: {
      type: 'object',
      properties: {
        bucket: { type: 'string', description: 'Bucket ID' },
        path: { type: 'string', description: 'File path' },
        options: { type: 'object', description: 'Metadata to update (cacheControl, contentType, etc.)' },
      },
      required: ['bucket', 'path', 'options'],
    },
  },

  // POLICIES (9 tools)
  {
    name: 'supabase_storage_create_policy',
    description: 'Create a storage policy',
    inputSchema: {
      type: 'object',
      properties: {
        bucket: { type: 'string', description: 'Bucket ID' },
        name: { type: 'string', description: 'Policy name' },
        definition: { type: 'object', description: 'Policy definition' },
      },
      required: ['bucket', 'name', 'definition'],
    },
  },
  {
    name: 'supabase_storage_get_policy',
    description: 'Get a storage policy',
    inputSchema: {
      type: 'object',
      properties: {
        bucket: { type: 'string', description: 'Bucket ID' },
        name: { type: 'string', description: 'Policy name' },
      },
      required: ['bucket', 'name'],
    },
  },
  {
    name: 'supabase_storage_list_policies',
    description: 'List all storage policies for a bucket',
    inputSchema: {
      type: 'object',
      properties: {
        bucket: { type: 'string', description: 'Bucket ID' },
      },
      required: ['bucket'],
    },
  },
  {
    name: 'supabase_storage_update_policy',
    description: 'Update a storage policy',
    inputSchema: {
      type: 'object',
      properties: {
        bucket: { type: 'string', description: 'Bucket ID' },
        name: { type: 'string', description: 'Policy name' },
        definition: { type: 'object', description: 'Updated policy definition' },
      },
      required: ['bucket', 'name', 'definition'],
    },
  },
  {
    name: 'supabase_storage_delete_policy',
    description: 'Delete a storage policy',
    inputSchema: {
      type: 'object',
      properties: {
        bucket: { type: 'string', description: 'Bucket ID' },
        name: { type: 'string', description: 'Policy name' },
      },
      required: ['bucket', 'name'],
    },
  },

  // ============================================================
  // REALTIME (15 tools)
  // ============================================================

  // CHANNELS (4 tools)
  {
    name: 'supabase_realtime_channel',
    description: 'Create a realtime channel',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Channel name' },
        options: { type: 'object', description: 'Channel options' },
      },
      required: ['name'],
    },
  },
  {
    name: 'supabase_realtime_subscribe',
    description: 'Subscribe to a channel',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel name' },
        callback: { type: 'string', description: 'Callback function name' },
      },
      required: ['channel'],
    },
  },
  {
    name: 'supabase_realtime_unsubscribe',
    description: 'Unsubscribe from a channel',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel name' },
      },
      required: ['channel'],
    },
  },
  {
    name: 'supabase_realtime_remove_channel',
    description: 'Remove a channel',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel name' },
      },
      required: ['channel'],
    },
  },

  // PRESENCE (4 tools)
  {
    name: 'supabase_realtime_track_presence',
    description: 'Track user presence in a channel',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel name' },
        state: { type: 'object', description: 'Presence state' },
      },
      required: ['channel', 'state'],
    },
  },
  {
    name: 'supabase_realtime_untrack_presence',
    description: 'Stop tracking user presence',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel name' },
      },
      required: ['channel'],
    },
  },
  {
    name: 'supabase_realtime_get_presence',
    description: 'Get current presence state',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel name' },
      },
      required: ['channel'],
    },
  },
  {
    name: 'supabase_realtime_on_presence',
    description: 'Listen to presence events',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel name' },
        event: { type: 'string', description: 'Event type (sync, join, leave)' },
      },
      required: ['channel', 'event'],
    },
  },

  // BROADCAST (4 tools)
  {
    name: 'supabase_realtime_broadcast',
    description: 'Broadcast a message to a channel',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel name' },
        event: { type: 'string', description: 'Event name' },
        payload: { type: 'object', description: 'Message payload' },
      },
      required: ['channel', 'event', 'payload'],
    },
  },
  {
    name: 'supabase_realtime_on_broadcast',
    description: 'Listen to broadcast messages',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel name' },
        event: { type: 'string', description: 'Event name' },
      },
      required: ['channel', 'event'],
    },
  },

  // DATABASE CHANGES (3 tools)
  {
    name: 'supabase_realtime_on_postgres_changes',
    description: 'Listen to database changes',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel name' },
        event: { type: 'string', description: 'Event type (INSERT, UPDATE, DELETE, *)' },
        schema: { type: 'string', description: 'Database schema (default: public)' },
        table: { type: 'string', description: 'Table name' },
        filter: { type: 'string', description: 'Filter expression (optional)' },
      },
      required: ['channel', 'event', 'table'],
    },
  },
  {
    name: 'supabase_realtime_remove_all_channels',
    description: 'Remove all realtime channels',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'supabase_realtime_get_channels',
    description: 'Get all active channels',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ============================================================
  // EDGE FUNCTIONS (15 tools)
  // ============================================================

  {
    name: 'supabase_functions_invoke',
    description: 'Invoke an edge function',
    inputSchema: {
      type: 'object',
      properties: {
        functionName: { type: 'string', description: 'Function name' },
        body: { description: 'Request body' },
        headers: { type: 'object', description: 'Request headers' },
        method: { type: 'string', description: 'HTTP method (default: POST)' },
      },
      required: ['functionName'],
    },
  },
  {
    name: 'supabase_functions_list',
    description: 'List all edge functions',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'supabase_functions_get',
    description: 'Get edge function details',
    inputSchema: {
      type: 'object',
      properties: {
        functionName: { type: 'string', description: 'Function name' },
      },
      required: ['functionName'],
    },
  },
  {
    name: 'supabase_functions_create',
    description: 'Create a new edge function',
    inputSchema: {
      type: 'object',
      properties: {
        functionName: { type: 'string', description: 'Function name' },
        code: { type: 'string', description: 'Function code' },
        options: { type: 'object', description: 'Function options' },
      },
      required: ['functionName', 'code'],
    },
  },
  {
    name: 'supabase_functions_update',
    description: 'Update an edge function',
    inputSchema: {
      type: 'object',
      properties: {
        functionName: { type: 'string', description: 'Function name' },
        code: { type: 'string', description: 'Updated function code' },
        options: { type: 'object', description: 'Function options' },
      },
      required: ['functionName'],
    },
  },
  {
    name: 'supabase_functions_delete',
    description: 'Delete an edge function',
    inputSchema: {
      type: 'object',
      properties: {
        functionName: { type: 'string', description: 'Function name' },
      },
      required: ['functionName'],
    },
  },
  {
    name: 'supabase_functions_get_logs',
    description: 'Get edge function logs',
    inputSchema: {
      type: 'object',
      properties: {
        functionName: { type: 'string', description: 'Function name' },
        limit: { type: 'number', description: 'Number of logs to retrieve' },
      },
      required: ['functionName'],
    },
  },

  // ============================================================
  // MANAGEMENT API (10 tools)
  // ============================================================

  // PROJECTS (5 tools)
  {
    name: 'supabase_management_create_project',
    description: 'Create a new Supabase project',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string', description: 'Organization ID' },
        name: { type: 'string', description: 'Project name' },
        region: { type: 'string', description: 'Project region' },
        dbPass: { type: 'string', description: 'Database password' },
      },
      required: ['organizationId', 'name', 'region', 'dbPass'],
    },
  },
  {
    name: 'supabase_management_list_projects',
    description: 'List all projects',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'supabase_management_get_project',
    description: 'Get project details',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'supabase_management_update_project',
    description: 'Update project settings',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
        settings: { type: 'object', description: 'Settings to update' },
      },
      required: ['projectId', 'settings'],
    },
  },
  {
    name: 'supabase_management_delete_project',
    description: 'Delete a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },
      },
      required: ['projectId'],
    },
  },

  // ORGANIZATIONS (5 tools)
  {
    name: 'supabase_management_create_organization',
    description: 'Create a new organization',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Organization name' },
      },
      required: ['name'],
    },
  },
  {
    name: 'supabase_management_list_organizations',
    description: 'List all organizations',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'supabase_management_get_organization',
    description: 'Get organization details',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string', description: 'Organization ID' },
      },
      required: ['organizationId'],
    },
  },
  {
    name: 'supabase_management_update_organization',
    description: 'Update organization settings',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string', description: 'Organization ID' },
        settings: { type: 'object', description: 'Settings to update' },
      },
      required: ['organizationId', 'settings'],
    },
  },
  {
    name: 'supabase_management_delete_organization',
    description: 'Delete an organization',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string', description: 'Organization ID' },
      },
      required: ['organizationId'],
    },
  },
];

