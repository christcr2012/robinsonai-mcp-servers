/**
 * Supabase Realtime Tools
 * 10 comprehensive realtime subscription tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createRealtimeTools(): Tool[] {
  return [
    {
      name: 'supabase_realtime_subscribe_table',
      description: 'Subscribe to table changes (INSERT, UPDATE, DELETE)',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name to subscribe to' },
          event: { type: 'string', description: 'Event type (INSERT, UPDATE, DELETE, or * for all)' },
          filter: { type: 'string', description: 'Filter expression (e.g., "id=eq.123")' },
        },
        required: ['table'],
      },
    },
    {
      name: 'supabase_realtime_subscribe_channel',
      description: 'Subscribe to a realtime channel',
      inputSchema: {
        type: 'object',
        properties: {
          channel: { type: 'string', description: 'Channel name' },
          config: { type: 'object', description: 'Channel configuration' },
        },
        required: ['channel'],
      },
    },
    {
      name: 'supabase_realtime_broadcast',
      description: 'Broadcast a message to channel',
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
      name: 'supabase_realtime_presence_track',
      description: 'Track user presence in channel',
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
      name: 'supabase_realtime_presence_untrack',
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
      name: 'supabase_realtime_get_channels',
      description: 'Get all active realtime channels',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'supabase_realtime_remove_channel',
      description: 'Remove a realtime channel',
      inputSchema: {
        type: 'object',
        properties: {
          channel: { type: 'string', description: 'Channel name to remove' },
        },
        required: ['channel'],
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
      name: 'supabase_realtime_postgres_changes',
      description: 'Subscribe to PostgreSQL changes with advanced filters',
      inputSchema: {
        type: 'object',
        properties: {
          event: { type: 'string', description: 'Event type (INSERT, UPDATE, DELETE, *)' },
          schema: { type: 'string', description: 'Database schema (default: public)' },
          table: { type: 'string', description: 'Table name' },
          filter: { type: 'string', description: 'Filter expression' },
        },
        required: ['event', 'table'],
      },
    },
    {
      name: 'supabase_realtime_channel_send',
      description: 'Send a message to specific channel subscribers',
      inputSchema: {
        type: 'object',
        properties: {
          channel: { type: 'string', description: 'Channel name' },
          type: { type: 'string', description: 'Message type (broadcast, presence, postgres_changes)' },
          event: { type: 'string', description: 'Event name' },
          payload: { type: 'object', description: 'Message payload' },
        },
        required: ['channel', 'type', 'event', 'payload'],
      },
    },
  ];
}

