/**
 * Stripe Product Tools
 * 6 comprehensive product management tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createProductTools(): Tool[] {
  return [
    {
      name: 'stripe_product_create',
      description: 'Create a new product',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Product name' },
          description: { type: 'string', description: 'Product description' },
          active: { type: 'boolean', description: 'Whether product is active' },
          metadata: { type: 'object', description: 'Custom metadata' },
          images: { type: 'array', description: 'Array of image URLs' },
          default_price_data: { type: 'object', description: 'Default price data' },
          tax_code: { type: 'string', description: 'Tax code for product' },
          unit_label: { type: 'string', description: 'Unit label (e.g., "per seat")' },
        },
        required: ['name'],
      },
    },
    {
      name: 'stripe_product_get',
      description: 'Retrieve a product by ID',
      inputSchema: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'Product ID' },
        },
        required: ['product_id'],
      },
    },
    {
      name: 'stripe_product_update',
      description: 'Update a product',
      inputSchema: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'Product ID' },
          name: { type: 'string', description: 'Updated name' },
          description: { type: 'string', description: 'Updated description' },
          active: { type: 'boolean', description: 'Updated active status' },
          metadata: { type: 'object', description: 'Updated metadata' },
          images: { type: 'array', description: 'Updated image URLs' },
        },
        required: ['product_id'],
      },
    },
    {
      name: 'stripe_product_delete',
      description: 'Delete a product',
      inputSchema: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'Product ID to delete' },
        },
        required: ['product_id'],
      },
    },
    {
      name: 'stripe_product_list',
      description: 'List all products with filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of products (max 100)' },
          active: { type: 'boolean', description: 'Filter by active status' },
          created: { type: 'object', description: 'Filter by creation date' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
        },
      },
    },
    {
      name: 'stripe_product_search',
      description: 'Search products using query language',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (e.g., "active:\'true\' AND name~\'premium\'")' },
          limit: { type: 'number', description: 'Number of results' },
          page: { type: 'string', description: 'Page token' },
        },
        required: ['query'],
      },
    },
  ];
}

