/**
 * Supabase Database Tools
 * 25 comprehensive database query and management tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createDatabaseTools(): Tool[] {
  return [
    {
      name: 'supabase_db_select',
      description: 'Select data from a table',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          columns: { type: 'string', description: 'Columns to select (comma-separated or *)' },
          filters: { type: 'object', description: 'Filter conditions' },
          order: { type: 'object', description: 'Order by configuration' },
          limit: { type: 'number', description: 'Limit results' },
          offset: { type: 'number', description: 'Offset for pagination' },
        },
        required: ['table'],
      },
    },
    {
      name: 'supabase_db_insert',
      description: 'Insert data into a table',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          data: { type: 'object', description: 'Data to insert (single object or array)' },
          options: { type: 'object', description: 'Insert options (returning, onConflict, etc.)' },
        },
        required: ['table', 'data'],
      },
    },
    {
      name: 'supabase_db_update',
      description: 'Update data in a table',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          data: { type: 'object', description: 'Data to update' },
          filters: { type: 'object', description: 'Filter conditions for rows to update' },
        },
        required: ['table', 'data', 'filters'],
      },
    },
    {
      name: 'supabase_db_delete',
      description: 'Delete data from a table',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          filters: { type: 'object', description: 'Filter conditions for rows to delete' },
        },
        required: ['table', 'filters'],
      },
    },
    {
      name: 'supabase_db_upsert',
      description: 'Upsert data (insert or update)',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          data: { type: 'object', description: 'Data to upsert' },
          options: { type: 'object', description: 'Upsert options (onConflict, ignoreDuplicates, etc.)' },
        },
        required: ['table', 'data'],
      },
    },
    {
      name: 'supabase_db_count',
      description: 'Count rows in a table',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          filters: { type: 'object', description: 'Filter conditions' },
          count: { type: 'string', description: 'Count type (exact, planned, estimated)' },
        },
        required: ['table'],
      },
    },
    {
      name: 'supabase_db_rpc',
      description: 'Call a PostgreSQL function',
      inputSchema: {
        type: 'object',
        properties: {
          function_name: { type: 'string', description: 'Function name' },
          params: { type: 'object', description: 'Function parameters' },
        },
        required: ['function_name'],
      },
    },
    {
      name: 'supabase_db_filter_eq',
      description: 'Filter rows where column equals value',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          column: { type: 'string', description: 'Column name' },
          value: { type: 'string', description: 'Value to match' },
        },
        required: ['table', 'column', 'value'],
      },
    },
    {
      name: 'supabase_db_filter_neq',
      description: 'Filter rows where column not equals value',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          column: { type: 'string', description: 'Column name' },
          value: { type: 'string', description: 'Value to exclude' },
        },
        required: ['table', 'column', 'value'],
      },
    },
    {
      name: 'supabase_db_filter_gt',
      description: 'Filter rows where column greater than value',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          column: { type: 'string', description: 'Column name' },
          value: { type: 'string', description: 'Value to compare' },
        },
        required: ['table', 'column', 'value'],
      },
    },
    {
      name: 'supabase_db_filter_gte',
      description: 'Filter rows where column greater than or equal to value',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          column: { type: 'string', description: 'Column name' },
          value: { type: 'string', description: 'Value to compare' },
        },
        required: ['table', 'column', 'value'],
      },
    },
    {
      name: 'supabase_db_filter_lt',
      description: 'Filter rows where column less than value',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          column: { type: 'string', description: 'Column name' },
          value: { type: 'string', description: 'Value to compare' },
        },
        required: ['table', 'column', 'value'],
      },
    },
    {
      name: 'supabase_db_filter_lte',
      description: 'Filter rows where column less than or equal to value',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          column: { type: 'string', description: 'Column name' },
          value: { type: 'string', description: 'Value to compare' },
        },
        required: ['table', 'column', 'value'],
      },
    },
    {
      name: 'supabase_db_filter_like',
      description: 'Filter rows with pattern matching (LIKE)',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          column: { type: 'string', description: 'Column name' },
          pattern: { type: 'string', description: 'Pattern to match (use % for wildcards)' },
        },
        required: ['table', 'column', 'pattern'],
      },
    },
    {
      name: 'supabase_db_filter_ilike',
      description: 'Filter rows with case-insensitive pattern matching (ILIKE)',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          column: { type: 'string', description: 'Column name' },
          pattern: { type: 'string', description: 'Pattern to match (use % for wildcards)' },
        },
        required: ['table', 'column', 'pattern'],
      },
    },
    {
      name: 'supabase_db_filter_in',
      description: 'Filter rows where column is in array of values',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          column: { type: 'string', description: 'Column name' },
          values: { type: 'array', description: 'Array of values' },
        },
        required: ['table', 'column', 'values'],
      },
    },
    {
      name: 'supabase_db_filter_is',
      description: 'Filter rows where column is null or boolean',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          column: { type: 'string', description: 'Column name' },
          value: { type: 'string', description: 'Value (null, true, false)' },
        },
        required: ['table', 'column', 'value'],
      },
    },
    {
      name: 'supabase_db_order',
      description: 'Order query results',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          column: { type: 'string', description: 'Column to order by' },
          ascending: { type: 'boolean', description: 'Ascending order (default true)' },
          nullsFirst: { type: 'boolean', description: 'Nulls first' },
        },
        required: ['table', 'column'],
      },
    },
    {
      name: 'supabase_db_range',
      description: 'Limit query results with range',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          from: { type: 'number', description: 'Start index' },
          to: { type: 'number', description: 'End index' },
        },
        required: ['table', 'from', 'to'],
      },
    },
    {
      name: 'supabase_db_single',
      description: 'Get single row from query',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          filters: { type: 'object', description: 'Filter conditions' },
        },
        required: ['table'],
      },
    },
    {
      name: 'supabase_db_maybeSingle',
      description: 'Get single row or null from query',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          filters: { type: 'object', description: 'Filter conditions' },
        },
        required: ['table'],
      },
    },
    {
      name: 'supabase_db_text_search',
      description: 'Full-text search on column',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          column: { type: 'string', description: 'Column name' },
          query: { type: 'string', description: 'Search query' },
          config: { type: 'string', description: 'Text search configuration' },
        },
        required: ['table', 'column', 'query'],
      },
    },
    {
      name: 'supabase_db_match',
      description: 'Match multiple column values',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          query: { type: 'object', description: 'Object with column-value pairs to match' },
        },
        required: ['table', 'query'],
      },
    },
    {
      name: 'supabase_db_not',
      description: 'Negate a filter',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          column: { type: 'string', description: 'Column name' },
          operator: { type: 'string', description: 'Operator to negate (eq, in, etc.)' },
          value: { type: 'string', description: 'Value' },
        },
        required: ['table', 'column', 'operator', 'value'],
      },
    },
    {
      name: 'supabase_db_or',
      description: 'Combine filters with OR',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          filters: { type: 'string', description: 'Filter string (e.g., "age.gte.18,age.lte.65")' },
        },
        required: ['table', 'filters'],
      },
    },
  ];
}

