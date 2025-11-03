/**
 * Stripe Tax Rate Tools
 * 5 comprehensive tax rate management tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createTaxRateTools(): Tool[] {
  return [
    {
      name: 'stripe_tax_rate_create',
      description: 'Create a new tax rate',
      inputSchema: {
        type: 'object',
        properties: {
          display_name: { type: 'string', description: 'Tax rate display name' },
          percentage: { type: 'number', description: 'Tax percentage (e.g., 8.5 for 8.5%)' },
          inclusive: { type: 'boolean', description: 'Whether tax is inclusive' },
          description: { type: 'string', description: 'Tax rate description' },
          jurisdiction: { type: 'string', description: 'Tax jurisdiction' },
          active: { type: 'boolean', description: 'Whether tax rate is active' },
          metadata: { type: 'object', description: 'Custom metadata' },
          country: { type: 'string', description: 'Two-letter country code' },
          state: { type: 'string', description: 'State/province/region' },
        },
        required: ['display_name', 'percentage', 'inclusive'],
      },
    },
    {
      name: 'stripe_tax_rate_get',
      description: 'Retrieve a tax rate by ID',
      inputSchema: {
        type: 'object',
        properties: {
          tax_rate_id: { type: 'string', description: 'Tax rate ID' },
        },
        required: ['tax_rate_id'],
      },
    },
    {
      name: 'stripe_tax_rate_update',
      description: 'Update a tax rate',
      inputSchema: {
        type: 'object',
        properties: {
          tax_rate_id: { type: 'string', description: 'Tax rate ID' },
          active: { type: 'boolean', description: 'Updated active status' },
          display_name: { type: 'string', description: 'Updated display name' },
          description: { type: 'string', description: 'Updated description' },
          metadata: { type: 'object', description: 'Updated metadata' },
        },
        required: ['tax_rate_id'],
      },
    },
    {
      name: 'stripe_tax_rate_list',
      description: 'List all tax rates with filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of tax rates (max 100)' },
          active: { type: 'boolean', description: 'Filter by active status' },
          inclusive: { type: 'boolean', description: 'Filter by inclusive status' },
          created: { type: 'object', description: 'Filter by creation date' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
        },
      },
    },
    {
      name: 'stripe_tax_calculation_create',
      description: 'Calculate tax for a transaction',
      inputSchema: {
        type: 'object',
        properties: {
          currency: { type: 'string', description: 'Three-letter ISO currency code' },
          line_items: { type: 'array', description: 'Array of line items to calculate tax for' },
          customer_details: { type: 'object', description: 'Customer details for tax calculation' },
          shipping_cost: { type: 'object', description: 'Shipping cost details' },
        },
        required: ['currency', 'line_items'],
      },
    },
  ];
}

