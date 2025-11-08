/**
 * Supabase Tool Definitions (120 tools)
 *
 * Resource Groups:
 * - Database/PostgREST: 30 tools
 * - Auth: 25 tools
 * - Storage: 25 tools
 * - Realtime: 15 tools
 * - Edge Functions: 15 tools
 * - Management API: 10 tools
 */

import { SUPABASE_TOOLS_2 } from './supabase-tools-2.js';

const SUPABASE_TOOLS_1 = [
  // ============================================================
  // DATABASE/POSTGREST (30 tools)
  // ============================================================

  // SELECT OPERATIONS (10 tools)
  {
    name: 'supabase_db_select',
    description: 'Select data from a table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'string', description: 'Columns to select (comma-separated, default: *)' },
      },
      required: ['table'],
    },
  },
  {
    name: 'supabase_db_select_eq',
    description: 'Select data with equality filter',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'string', description: 'Columns to select' },
        column: { type: 'string', description: 'Column to filter on' },
        value: { description: 'Value to match' },
      },
      required: ['table', 'column', 'value'],
    },
  },
  {
    name: 'supabase_db_select_neq',
    description: 'Select data with not-equal filter',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'string', description: 'Columns to select' },
        column: { type: 'string', description: 'Column to filter on' },
        value: { description: 'Value to not match' },
      },
      required: ['table', 'column', 'value'],
    },
  },
  {
    name: 'supabase_db_select_gt',
    description: 'Select data with greater-than filter',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'string', description: 'Columns to select' },
        column: { type: 'string', description: 'Column to filter on' },
        value: { description: 'Value to compare' },
      },
      required: ['table', 'column', 'value'],
    },
  },
  {
    name: 'supabase_db_select_gte',
    description: 'Select data with greater-than-or-equal filter',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'string', description: 'Columns to select' },
        column: { type: 'string', description: 'Column to filter on' },
        value: { description: 'Value to compare' },
      },
      required: ['table', 'column', 'value'],
    },
  },
  {
    name: 'supabase_db_select_lt',
    description: 'Select data with less-than filter',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'string', description: 'Columns to select' },
        column: { type: 'string', description: 'Column to filter on' },
        value: { description: 'Value to compare' },
      },
      required: ['table', 'column', 'value'],
    },
  },
  {
    name: 'supabase_db_select_lte',
    description: 'Select data with less-than-or-equal filter',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'string', description: 'Columns to select' },
        column: { type: 'string', description: 'Column to filter on' },
        value: { description: 'Value to compare' },
      },
      required: ['table', 'column', 'value'],
    },
  },
  {
    name: 'supabase_db_select_like',
    description: 'Select data with LIKE pattern match (case-sensitive)',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'string', description: 'Columns to select' },
        column: { type: 'string', description: 'Column to filter on' },
        pattern: { type: 'string', description: 'Pattern to match (use % for wildcard)' },
      },
      required: ['table', 'column', 'pattern'],
    },
  },
  {
    name: 'supabase_db_select_ilike',
    description: 'Select data with ILIKE pattern match (case-insensitive)',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'string', description: 'Columns to select' },
        column: { type: 'string', description: 'Column to filter on' },
        pattern: { type: 'string', description: 'Pattern to match (use % for wildcard)' },
      },
      required: ['table', 'column', 'pattern'],
    },
  },
  {
    name: 'supabase_db_select_in',
    description: 'Select data where column value is in array',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'string', description: 'Columns to select' },
        column: { type: 'string', description: 'Column to filter on' },
        values: { type: 'array', description: 'Array of values to match' },
      },
      required: ['table', 'column', 'values'],
    },
  },

  // QUERY MODIFIERS (5 tools)
  {
    name: 'supabase_db_order',
    description: 'Order query results',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'string', description: 'Columns to select' },
        column: { type: 'string', description: 'Column to order by' },
        ascending: { type: 'boolean', description: 'Sort ascending (default: true)' },
      },
      required: ['table', 'column'],
    },
  },
  {
    name: 'supabase_db_limit',
    description: 'Limit number of results',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'string', description: 'Columns to select' },
        count: { type: 'number', description: 'Maximum number of rows to return' },
      },
      required: ['table', 'count'],
    },
  },
  {
    name: 'supabase_db_range',
    description: 'Select a range of rows',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'string', description: 'Columns to select' },
        from: { type: 'number', description: 'Starting index (0-based)' },
        to: { type: 'number', description: 'Ending index (inclusive)' },
      },
      required: ['table', 'from', 'to'],
    },
  },
  {
    name: 'supabase_db_single',
    description: 'Select a single row',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'string', description: 'Columns to select' },
        column: { type: 'string', description: 'Column to filter on' },
        value: { description: 'Value to match' },
      },
      required: ['table', 'column', 'value'],
    },
  },
  {
    name: 'supabase_db_maybe_single',
    description: 'Select a single row or null if not found',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'string', description: 'Columns to select' },
        column: { type: 'string', description: 'Column to filter on' },
        value: { description: 'Value to match' },
      },
      required: ['table', 'column', 'value'],
    },
  },

  // INSERT/UPDATE/DELETE (15 tools)
  {
    name: 'supabase_db_insert',
    description: 'Insert data into a table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        data: { type: 'object', description: 'Data to insert' },
      },
      required: ['table', 'data'],
    },
  },
  {
    name: 'supabase_db_insert_many',
    description: 'Insert multiple rows into a table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        data: { type: 'array', description: 'Array of objects to insert' },
      },
      required: ['table', 'data'],
    },
  },
  {
    name: 'supabase_db_upsert',
    description: 'Insert or update data (upsert)',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        data: { type: 'object', description: 'Data to upsert' },
        onConflict: { type: 'string', description: 'Column(s) to check for conflicts' },
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
        column: { type: 'string', description: 'Column to filter on' },
        value: { description: 'Value to match' },
      },
      required: ['table', 'data', 'column', 'value'],
    },
  },
  {
    name: 'supabase_db_delete',
    description: 'Delete data from a table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        column: { type: 'string', description: 'Column to filter on' },
        value: { description: 'Value to match' },
      },
      required: ['table', 'column', 'value'],
    },
  },
  {
    name: 'supabase_db_rpc',
    description: 'Call a database function',
    inputSchema: {
      type: 'object',
      properties: {
        functionName: { type: 'string', description: 'Function name' },
        params: { type: 'object', description: 'Function parameters' },
      },
      required: ['functionName'],
    },
  },

  // ============================================================
  // AUTH (25 tools)
  // ============================================================

  // SIGN UP (3 tools)
  {
    name: 'supabase_auth_sign_up',
    description: 'Sign up a new user with email and password',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'User email' },
        password: { type: 'string', description: 'User password' },
        options: { type: 'object', description: 'Additional options (data, redirectTo, etc.)' },
      },
      required: ['email', 'password'],
    },
  },
  {
    name: 'supabase_auth_sign_up_phone',
    description: 'Sign up a new user with phone number',
    inputSchema: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Phone number' },
        password: { type: 'string', description: 'User password' },
        options: { type: 'object', description: 'Additional options' },
      },
      required: ['phone', 'password'],
    },
  },
  {
    name: 'supabase_auth_sign_up_oauth',
    description: 'Sign up with OAuth provider',
    inputSchema: {
      type: 'object',
      properties: {
        provider: { type: 'string', description: 'OAuth provider (google, github, etc.)' },
        options: { type: 'object', description: 'Additional options (redirectTo, scopes, etc.)' },
      },
      required: ['provider'],
    },
  },

  // SIGN IN (5 tools)
  {
    name: 'supabase_auth_sign_in_password',
    description: 'Sign in with email and password',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'User email' },
        password: { type: 'string', description: 'User password' },
      },
      required: ['email', 'password'],
    },
  },
  {
    name: 'supabase_auth_sign_in_phone',
    description: 'Sign in with phone and password',
    inputSchema: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Phone number' },
        password: { type: 'string', description: 'User password' },
      },
      required: ['phone', 'password'],
    },
  },
  {
    name: 'supabase_auth_sign_in_oauth',
    description: 'Sign in with OAuth provider',
    inputSchema: {
      type: 'object',
      properties: {
        provider: { type: 'string', description: 'OAuth provider (google, github, etc.)' },
        options: { type: 'object', description: 'Additional options (redirectTo, scopes, etc.)' },
      },
      required: ['provider'],
    },
  },
  {
    name: 'supabase_auth_sign_in_otp',
    description: 'Sign in with one-time password',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'User email (if using email OTP)' },
        phone: { type: 'string', description: 'Phone number (if using phone OTP)' },
        options: { type: 'object', description: 'Additional options' },
      },
    },
  },
  {
    name: 'supabase_auth_verify_otp',
    description: 'Verify one-time password',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'User email (if using email OTP)' },
        phone: { type: 'string', description: 'Phone number (if using phone OTP)' },
        token: { type: 'string', description: 'OTP token' },
        type: { type: 'string', description: 'OTP type (email, sms, etc.)' },
      },
      required: ['token', 'type'],
    },
  },

  // SIGN OUT (1 tool)
  {
    name: 'supabase_auth_sign_out',
    description: 'Sign out the current user',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // SESSION (3 tools)
  {
    name: 'supabase_auth_get_session',
    description: 'Get the current session',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'supabase_auth_refresh_session',
    description: 'Refresh the current session',
    inputSchema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string', description: 'Refresh token (optional)' },
      },
    },
  },
  {
    name: 'supabase_auth_set_session',
    description: 'Set the session from access and refresh tokens',
    inputSchema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'Access token' },
        refreshToken: { type: 'string', description: 'Refresh token' },
      },
      required: ['accessToken', 'refreshToken'],
    },
  },

  // USER (4 tools)
  {
    name: 'supabase_auth_get_user',
    description: 'Get the current user',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'supabase_auth_update_user',
    description: 'Update the current user',
    inputSchema: {
      type: 'object',
      properties: {
        attributes: { type: 'object', description: 'User attributes to update (email, password, data, etc.)' },
      },
      required: ['attributes'],
    },
  },
  {
    name: 'supabase_auth_delete_user',
    description: 'Delete the current user',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'supabase_auth_reset_password',
    description: 'Send password reset email',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'User email' },
        options: { type: 'object', description: 'Additional options (redirectTo, etc.)' },
      },
      required: ['email'],
    },
  },

  // ADMIN (9 tools)
  {
    name: 'supabase_auth_admin_list_users',
    description: 'List all users (admin)',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number' },
        perPage: { type: 'number', description: 'Users per page' },
      },
    },
  },
  {
    name: 'supabase_auth_admin_get_user',
    description: 'Get user by ID (admin)',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'supabase_auth_admin_create_user',
    description: 'Create a new user (admin)',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'User email' },
        password: { type: 'string', description: 'User password' },
        emailConfirm: { type: 'boolean', description: 'Auto-confirm email' },
        userMetadata: { type: 'object', description: 'User metadata' },
      },
      required: ['email', 'password'],
    },
  },
  {
    name: 'supabase_auth_admin_update_user',
    description: 'Update user by ID (admin)',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID' },
        attributes: { type: 'object', description: 'User attributes to update' },
      },
      required: ['userId', 'attributes'],
    },
  },
  {
    name: 'supabase_auth_admin_delete_user',
    description: 'Delete user by ID (admin)',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'supabase_auth_admin_invite_user',
    description: 'Invite user by email (admin)',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'User email' },
        options: { type: 'object', description: 'Additional options' },
      },
      required: ['email'],
    },
  },
  {
    name: 'supabase_auth_admin_generate_link',
    description: 'Generate magic link for user (admin)',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Link type (signup, magiclink, recovery, etc.)' },
        email: { type: 'string', description: 'User email' },
        options: { type: 'object', description: 'Additional options' },
      },
      required: ['type', 'email'],
    },
  },
  {
    name: 'supabase_auth_admin_update_user_metadata',
    description: 'Update user metadata (admin)',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID' },
        userMetadata: { type: 'object', description: 'User metadata to update' },
      },
      required: ['userId', 'userMetadata'],
    },
  },
  {
    name: 'supabase_auth_admin_list_factors',
    description: 'List MFA factors for user (admin)',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID' },
      },
      required: ['userId'],
    },
  },
];

// Combine all Supabase tools (55 from part 1 + 65 from part 2 = 120 total)
export const SUPABASE_TOOLS = [
  ...SUPABASE_TOOLS_1,
  ...SUPABASE_TOOLS_2,
];
