/**
 * Stripe Client Wrapper
 * Handles authentication and API calls to Stripe
 */

import Stripe from 'stripe';

export class StripeClient {
  private stripe: Stripe | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = process.env.STRIPE_SECRET_KEY || null;
    
    if (this.apiKey) {
      this.stripe = new Stripe(this.apiKey, {
        apiVersion: '2025-02-24.acacia',
        typescript: true,
      });
      console.error('[Stripe MCP] ✅ Initialized with API key');
    } else {
      console.error('[Stripe MCP] ⚠️  No STRIPE_SECRET_KEY found - tools will be disabled');
    }
  }

  isConfigured(): boolean {
    return this.stripe !== null;
  }

  getClient(): Stripe {
    if (!this.stripe) {
      throw new Error('Stripe client not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    return this.stripe;
  }

  /**
   * Helper to handle Stripe API errors gracefully
   */
  async handleStripeCall<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.stripe) {
      throw new Error('Stripe client not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }

    try {
      return await operation();
    } catch (error: any) {
      if (error.type === 'StripeInvalidRequestError') {
        throw new Error(`Stripe API Error: ${error.message}`);
      } else if (error.type === 'StripeAuthenticationError') {
        throw new Error('Stripe authentication failed. Please check your API key.');
      } else if (error.type === 'StripePermissionError') {
        throw new Error(`Stripe permission error: ${error.message}`);
      } else if (error.type === 'StripeRateLimitError') {
        throw new Error('Stripe rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Stripe error: ${error.message || 'Unknown error'}`);
      }
    }
  }
}

