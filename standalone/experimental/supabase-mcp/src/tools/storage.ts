/**
 * Supabase Storage Tools
 * 15 comprehensive file storage tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createStorageTools(): Tool[] {
  return [
    {
      name: 'supabase_storage_upload',
      description: 'Upload a file to storage bucket',
      inputSchema: {
        type: 'object',
        properties: {
          bucket: { type: 'string', description: 'Bucket name' },
          path: { type: 'string', description: 'File path in bucket' },
          file: { type: 'string', description: 'File content or path' },
          options: { type: 'object', description: 'Upload options (contentType, cacheControl, upsert, etc.)' },
        },
        required: ['bucket', 'path', 'file'],
      },
    },
    {
      name: 'supabase_storage_download',
      description: 'Download a file from storage bucket',
      inputSchema: {
        type: 'object',
        properties: {
          bucket: { type: 'string', description: 'Bucket name' },
          path: { type: 'string', description: 'File path in bucket' },
        },
        required: ['bucket', 'path'],
      },
    },
    {
      name: 'supabase_storage_list',
      description: 'List files in a storage bucket',
      inputSchema: {
        type: 'object',
        properties: {
          bucket: { type: 'string', description: 'Bucket name' },
          path: { type: 'string', description: 'Folder path (optional)' },
          options: { type: 'object', description: 'List options (limit, offset, sortBy, etc.)' },
        },
        required: ['bucket'],
      },
    },
    {
      name: 'supabase_storage_delete',
      description: 'Delete files from storage bucket',
      inputSchema: {
        type: 'object',
        properties: {
          bucket: { type: 'string', description: 'Bucket name' },
          paths: { type: 'array', description: 'Array of file paths to delete' },
        },
        required: ['bucket', 'paths'],
      },
    },
    {
      name: 'supabase_storage_move',
      description: 'Move a file within storage bucket',
      inputSchema: {
        type: 'object',
        properties: {
          bucket: { type: 'string', description: 'Bucket name' },
          fromPath: { type: 'string', description: 'Source file path' },
          toPath: { type: 'string', description: 'Destination file path' },
        },
        required: ['bucket', 'fromPath', 'toPath'],
      },
    },
    {
      name: 'supabase_storage_copy',
      description: 'Copy a file within storage bucket',
      inputSchema: {
        type: 'object',
        properties: {
          bucket: { type: 'string', description: 'Bucket name' },
          fromPath: { type: 'string', description: 'Source file path' },
          toPath: { type: 'string', description: 'Destination file path' },
        },
        required: ['bucket', 'fromPath', 'toPath'],
      },
    },
    {
      name: 'supabase_storage_create_signed_url',
      description: 'Create a signed URL for file access',
      inputSchema: {
        type: 'object',
        properties: {
          bucket: { type: 'string', description: 'Bucket name' },
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
          bucket: { type: 'string', description: 'Bucket name' },
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
          bucket: { type: 'string', description: 'Bucket name' },
          path: { type: 'string', description: 'File path' },
          options: { type: 'object', description: 'URL options (download, transform, etc.)' },
        },
        required: ['bucket', 'path'],
      },
    },
    {
      name: 'supabase_storage_create_bucket',
      description: 'Create a new storage bucket',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Bucket ID' },
          options: { type: 'object', description: 'Bucket options (public, fileSizeLimit, allowedMimeTypes, etc.)' },
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
      name: 'supabase_storage_update_bucket',
      description: 'Update bucket configuration',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Bucket ID' },
          options: { type: 'object', description: 'Updated bucket options' },
        },
        required: ['id', 'options'],
      },
    },
    {
      name: 'supabase_storage_delete_bucket',
      description: 'Delete a storage bucket',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Bucket ID to delete' },
        },
        required: ['id'],
      },
    },
    {
      name: 'supabase_storage_empty_bucket',
      description: 'Empty all files from a bucket',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Bucket ID to empty' },
        },
        required: ['id'],
      },
    },
  ];
}

