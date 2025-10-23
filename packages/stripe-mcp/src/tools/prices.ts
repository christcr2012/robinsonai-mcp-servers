/**
 * Stripe Price Tools
 * 6 comprehensive price management tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createPriceTools(): Tool[] {
  return [
    {
      name: 'stripe_price_create',
      description: 'Create a new price for a product',
      inputSchema: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Product ID' },
          currency: { type: 'string', description: 'Three-letter ISO currency code' },
          unit_amount: { type: 'number', description: 'Price in cents (for one-time or per-unit)' },
          recurring: { type: 'object', description: 'Recurring billing configuration' },
          billing_scheme: { type: 'string', description: 'Billing scheme (per_unit or tiered)' },
          tiers: { type: 'array', description: 'Pricing tiers for tiered billing' },
          metadata: { type: 'object', description: 'Custom metadata' },
          active: { type: 'boolean', description: 'Whether price is active' },
          nickname: { type: 'string', description: 'Price nickname' },
        },
        required: ['product', 'currency'],
      },
    },
    {
      name: 'stripe_price_get',
      description: 'Retrieve a price by ID',
      inputSchema: {
        type: 'object',
        properties: {
          price_id: { type: 'string', description: 'Price ID' },
        },
        required: ['price_id'],
      },
    },
    {
      name: 'stripe_price_update',
      description: 'Update a price (limited fields)',
      inputSchema: {
        type: 'object',
        properties: {
          price_id: { type: 'string', description: 'Price ID' },
          active: { type: 'boolean', description: 'Updated active status' },
          metadata: { type: 'object', description: 'Updated metadata' },
          nickname: { type: 'string', description: 'Updated nickname' },
        },
        required: ['price_id'],
      },
    },
    {
      name: 'stripe_price_list',
      description: 'List all prices with filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of prices (max 100)' },
          product: { type: 'string', description: 'Filter by product ID' },
          active: { type: 'boolean', description: 'Filter by active status' },
          currency: { type: 'string', description: 'Filter by currency' },
          type: { type: 'string', description: 'Filter by type (one_time or recurring)' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
        },
      },
    },
    {
      name: 'stripe_price_search',
      description: 'Search prices using query language',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (e.g., "active:\'true\' AND currency:\'usd\'")' },
          limit: { type: 'number', description: 'Number of results' },
          page: { type: 'string', description: 'Page token' },
        },
        required: ['query'],
      },
    },
    {
      name: 'stripe_price_create_recurring',
      description: 'Create a recurring price with simplified parameters',
      inputSchema: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Product ID' },
          currency: { type: 'string', description: 'Three-letter ISO currency code' },
          unit_amount: { type: 'number', description: 'Price in cents per billing period' },
          interval: { type: 'string', description: 'Billing interval (day, week, month, year)' },
          interval_count: { type: 'number', description: 'Number of intervals between billings' },
          trial_period_days: { type: 'number', description: 'Trial period in days' },
          metadata: { type: 'object', description: 'Custom metadata' },
        },
        required: ['product', 'currency', 'unit_amount', 'interval'],
      },
    },
  ];
}

