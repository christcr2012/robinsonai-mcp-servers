/**
 * Stripe Customer Tools
 * 10 comprehensive customer management tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createCustomerTools(): Tool[] {
  return [
    {
      name: 'stripe_customer_create',
      description: 'Create a new Stripe customer with email, name, metadata, payment method, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Customer email address' },
          name: { type: 'string', description: 'Customer name' },
          description: { type: 'string', description: 'Customer description' },
          phone: { type: 'string', description: 'Customer phone number' },
          metadata: { type: 'object', description: 'Custom metadata key-value pairs' },
          payment_method: { type: 'string', description: 'Payment method ID to attach' },
          invoice_settings: { type: 'object', description: 'Invoice settings' },
          address: { type: 'object', description: 'Customer address' },
          shipping: { type: 'object', description: 'Shipping information' },
        },
      },
    },
    {
      name: 'stripe_customer_get',
      description: 'Retrieve a customer by ID',
      inputSchema: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'Customer ID' },
        },
        required: ['customer_id'],
      },
    },
    {
      name: 'stripe_customer_update',
      description: 'Update customer details',
      inputSchema: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'Customer ID' },
          email: { type: 'string', description: 'New email address' },
          name: { type: 'string', description: 'New name' },
          description: { type: 'string', description: 'New description' },
          phone: { type: 'string', description: 'New phone number' },
          metadata: { type: 'object', description: 'Updated metadata' },
          default_source: { type: 'string', description: 'Default payment source ID' },
          invoice_settings: { type: 'object', description: 'Updated invoice settings' },
        },
        required: ['customer_id'],
      },
    },
    {
      name: 'stripe_customer_delete',
      description: 'Delete a customer',
      inputSchema: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'Customer ID to delete' },
        },
        required: ['customer_id'],
      },
    },
    {
      name: 'stripe_customer_list',
      description: 'List all customers with pagination and filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of customers to return (max 100)' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
          ending_before: { type: 'string', description: 'Cursor for reverse pagination' },
          email: { type: 'string', description: 'Filter by email' },
          created: { type: 'object', description: 'Filter by creation date' },
        },
      },
    },
    {
      name: 'stripe_customer_search',
      description: 'Search customers using Stripe query language',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (e.g., "email:\'customer@example.com\'" or "name:\'John\'")' },
          limit: { type: 'number', description: 'Number of results (max 100)' },
          page: { type: 'string', description: 'Page token for pagination' },
        },
        required: ['query'],
      },
    },
    {
      name: 'stripe_customer_balance_transaction_create',
      description: 'Create a customer balance transaction (credit or debit)',
      inputSchema: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'Customer ID' },
          amount: { type: 'number', description: 'Amount in cents (negative for credit, positive for debit)' },
          currency: { type: 'string', description: 'Three-letter ISO currency code' },
          description: { type: 'string', description: 'Transaction description' },
          metadata: { type: 'object', description: 'Custom metadata' },
        },
        required: ['customer_id', 'amount', 'currency'],
      },
    },
    {
      name: 'stripe_customer_balance_transactions_list',
      description: 'List all balance transactions for a customer',
      inputSchema: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'Customer ID' },
          limit: { type: 'number', description: 'Number of transactions to return' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
        },
        required: ['customer_id'],
      },
    },
    {
      name: 'stripe_customer_tax_id_create',
      description: 'Add a tax ID to a customer',
      inputSchema: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'Customer ID' },
          type: { type: 'string', description: 'Tax ID type (e.g., eu_vat, us_ein, au_abn)' },
          value: { type: 'string', description: 'Tax ID value' },
        },
        required: ['customer_id', 'type', 'value'],
      },
    },
    {
      name: 'stripe_customer_tax_id_delete',
      description: 'Remove a tax ID from a customer',
      inputSchema: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'Customer ID' },
          tax_id: { type: 'string', description: 'Tax ID to delete' },
        },
        required: ['customer_id', 'tax_id'],
      },
    },
  ];
}

