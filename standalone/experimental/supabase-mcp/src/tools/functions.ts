/**
 * Supabase Edge Functions Tools
 * 10 comprehensive edge function invocation tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createFunctionsTools(): Tool[] {
  return [
    {
      name: 'supabase_function_invoke',
      description: 'Invoke an edge function',
      inputSchema: {
        type: 'object',
        properties: {
          function_name: { type: 'string', description: 'Function name' },
          body: { type: 'object', description: 'Request body' },
          headers: { type: 'object', description: 'Request headers' },
          method: { type: 'string', description: 'HTTP method (GET, POST, etc.)' },
        },
        required: ['function_name'],
      },
    },
    {
      name: 'supabase_function_invoke_get',
      description: 'Invoke edge function with GET request',
      inputSchema: {
        type: 'object',
        properties: {
          function_name: { type: 'string', description: 'Function name' },
          params: { type: 'object', description: 'Query parameters' },
          headers: { type: 'object', description: 'Request headers' },
        },
        required: ['function_name'],
      },
    },
    {
      name: 'supabase_function_invoke_post',
      description: 'Invoke edge function with POST request',
      inputSchema: {
        type: 'object',
        properties: {
          function_name: { type: 'string', description: 'Function name' },
          body: { type: 'object', description: 'Request body' },
          headers: { type: 'object', description: 'Request headers' },
        },
        required: ['function_name', 'body'],
      },
    },
    {
      name: 'supabase_function_invoke_put',
      description: 'Invoke edge function with PUT request',
      inputSchema: {
        type: 'object',
        properties: {
          function_name: { type: 'string', description: 'Function name' },
          body: { type: 'object', description: 'Request body' },
          headers: { type: 'object', description: 'Request headers' },
        },
        required: ['function_name', 'body'],
      },
    },
    {
      name: 'supabase_function_invoke_patch',
      description: 'Invoke edge function with PATCH request',
      inputSchema: {
        type: 'object',
        properties: {
          function_name: { type: 'string', description: 'Function name' },
          body: { type: 'object', description: 'Request body' },
          headers: { type: 'object', description: 'Request headers' },
        },
        required: ['function_name', 'body'],
      },
    },
    {
      name: 'supabase_function_invoke_delete',
      description: 'Invoke edge function with DELETE request',
      inputSchema: {
        type: 'object',
        properties: {
          function_name: { type: 'string', description: 'Function name' },
          body: { type: 'object', description: 'Request body (optional)' },
          headers: { type: 'object', description: 'Request headers' },
        },
        required: ['function_name'],
      },
    },
    {
      name: 'supabase_function_invoke_with_auth',
      description: 'Invoke edge function with authentication',
      inputSchema: {
        type: 'object',
        properties: {
          function_name: { type: 'string', description: 'Function name' },
          body: { type: 'object', description: 'Request body' },
          token: { type: 'string', description: 'Auth token' },
          method: { type: 'string', description: 'HTTP method' },
        },
        required: ['function_name', 'token'],
      },
    },
    {
      name: 'supabase_function_invoke_async',
      description: 'Invoke edge function asynchronously',
      inputSchema: {
        type: 'object',
        properties: {
          function_name: { type: 'string', description: 'Function name' },
          body: { type: 'object', description: 'Request body' },
          headers: { type: 'object', description: 'Request headers' },
        },
        required: ['function_name'],
      },
    },
    {
      name: 'supabase_function_invoke_stream',
      description: 'Invoke edge function with streaming response',
      inputSchema: {
        type: 'object',
        properties: {
          function_name: { type: 'string', description: 'Function name' },
          body: { type: 'object', description: 'Request body' },
          headers: { type: 'object', description: 'Request headers' },
        },
        required: ['function_name'],
      },
    },
    {
      name: 'supabase_function_list',
      description: 'List all available edge functions',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];
}

