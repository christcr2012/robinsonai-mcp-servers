/**
 * Supabase Auth Tools
 * 20 comprehensive authentication tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createAuthTools(): Tool[] {
  return [
    {
      name: 'supabase_auth_signup',
      description: 'Sign up a new user with email and password',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'User email' },
          password: { type: 'string', description: 'User password' },
          options: { type: 'object', description: 'Additional options (data, emailRedirectTo, etc.)' },
        },
        required: ['email', 'password'],
      },
    },
    {
      name: 'supabase_auth_signin_password',
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
      name: 'supabase_auth_signin_otp',
      description: 'Sign in with OTP (one-time password)',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'User email' },
          phone: { type: 'string', description: 'User phone number' },
          options: { type: 'object', description: 'Additional options' },
        },
      },
    },
    {
      name: 'supabase_auth_signin_oauth',
      description: 'Sign in with OAuth provider',
      inputSchema: {
        type: 'object',
        properties: {
          provider: { type: 'string', description: 'OAuth provider (google, github, etc.)' },
          options: { type: 'object', description: 'OAuth options (redirectTo, scopes, etc.)' },
        },
        required: ['provider'],
      },
    },
    {
      name: 'supabase_auth_signout',
      description: 'Sign out current user',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'supabase_auth_get_session',
      description: 'Get current session',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'supabase_auth_get_user',
      description: 'Get current user',
      inputSchema: {
        type: 'object',
        properties: {
          jwt: { type: 'string', description: 'Optional JWT token' },
        },
      },
    },
    {
      name: 'supabase_auth_update_user',
      description: 'Update user attributes',
      inputSchema: {
        type: 'object',
        properties: {
          attributes: { type: 'object', description: 'User attributes to update (email, password, data, etc.)' },
        },
        required: ['attributes'],
      },
    },
    {
      name: 'supabase_auth_reset_password_email',
      description: 'Send password reset email',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'User email' },
          options: { type: 'object', description: 'Reset options (redirectTo, etc.)' },
        },
        required: ['email'],
      },
    },
    {
      name: 'supabase_auth_verify_otp',
      description: 'Verify OTP token',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'User email' },
          phone: { type: 'string', description: 'User phone' },
          token: { type: 'string', description: 'OTP token' },
          type: { type: 'string', description: 'OTP type (signup, recovery, email_change, etc.)' },
        },
        required: ['token', 'type'],
      },
    },
    {
      name: 'supabase_auth_refresh_session',
      description: 'Refresh current session',
      inputSchema: {
        type: 'object',
        properties: {
          refresh_token: { type: 'string', description: 'Refresh token' },
        },
      },
    },
    {
      name: 'supabase_auth_set_session',
      description: 'Set session from access and refresh tokens',
      inputSchema: {
        type: 'object',
        properties: {
          access_token: { type: 'string', description: 'Access token' },
          refresh_token: { type: 'string', description: 'Refresh token' },
        },
        required: ['access_token', 'refresh_token'],
      },
    },
    {
      name: 'supabase_auth_exchange_code',
      description: 'Exchange auth code for session',
      inputSchema: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Auth code' },
        },
        required: ['code'],
      },
    },
    {
      name: 'supabase_auth_mfa_enroll',
      description: 'Enroll in multi-factor authentication',
      inputSchema: {
        type: 'object',
        properties: {
          factorType: { type: 'string', description: 'MFA factor type (totp)' },
          friendlyName: { type: 'string', description: 'Friendly name for factor' },
        },
        required: ['factorType'],
      },
    },
    {
      name: 'supabase_auth_mfa_challenge',
      description: 'Create MFA challenge',
      inputSchema: {
        type: 'object',
        properties: {
          factorId: { type: 'string', description: 'MFA factor ID' },
        },
        required: ['factorId'],
      },
    },
    {
      name: 'supabase_auth_mfa_verify',
      description: 'Verify MFA challenge',
      inputSchema: {
        type: 'object',
        properties: {
          factorId: { type: 'string', description: 'MFA factor ID' },
          challengeId: { type: 'string', description: 'Challenge ID' },
          code: { type: 'string', description: 'Verification code' },
        },
        required: ['factorId', 'challengeId', 'code'],
      },
    },
    {
      name: 'supabase_auth_mfa_unenroll',
      description: 'Unenroll from MFA',
      inputSchema: {
        type: 'object',
        properties: {
          factorId: { type: 'string', description: 'MFA factor ID to unenroll' },
        },
        required: ['factorId'],
      },
    },
    {
      name: 'supabase_auth_mfa_list_factors',
      description: 'List all MFA factors for user',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'supabase_auth_admin_list_users',
      description: 'List all users (admin only)',
      inputSchema: {
        type: 'object',
        properties: {
          page: { type: 'number', description: 'Page number' },
          perPage: { type: 'number', description: 'Users per page' },
        },
      },
    },
    {
      name: 'supabase_auth_admin_delete_user',
      description: 'Delete a user (admin only)',
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: 'User ID to delete' },
        },
        required: ['userId'],
      },
    },
  ];
}

