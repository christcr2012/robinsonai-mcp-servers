// Stripe Tool Definitions - 150 tools across 6 resource groups
// Following IMPLEMENTATION-PLAN.md structure

export const STRIPE_TOOLS = [
  // ============================================================
  // CORE RESOURCES (30 tools)
  // ============================================================
  
  // CUSTOMERS (6 tools)
  { name: 'stripe_customer_create', description: 'Create a new customer', inputSchema: { type: 'object', additionalProperties: false, properties: { email: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, phone: { type: 'string' }, address: { type: 'object' }, metadata: { type: 'object' } } } },
  { name: 'stripe_customer_retrieve', description: 'Retrieve a customer', inputSchema: { type: 'object', additionalProperties: false, properties: { customer_id: { type: 'string' } }, required: ['customer_id'] } },
  { name: 'stripe_customer_update', description: 'Update a customer', inputSchema: { type: 'object', additionalProperties: false, properties: { customer_id: { type: 'string' }, email: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, phone: { type: 'string' }, address: { type: 'object' }, metadata: { type: 'object' } }, required: ['customer_id'] } },
  { name: 'stripe_customer_delete', description: 'Delete a customer', inputSchema: { type: 'object', additionalProperties: false, properties: { customer_id: { type: 'string' } }, required: ['customer_id'] } },
  { name: 'stripe_customer_list', description: 'List all customers', inputSchema: { type: 'object', additionalProperties: false, properties: { limit: { type: 'number' }, starting_after: { type: 'string' }, ending_before: { type: 'string' }, email: { type: 'string' } } } },
  { name: 'stripe_customer_search', description: 'Search customers', inputSchema: { type: 'object', additionalProperties: false, properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] } },

  // PAYMENT INTENTS (6 tools)
  { name: 'stripe_payment_intent_create', description: 'Create a payment intent', inputSchema: { type: 'object', additionalProperties: false, properties: { amount: { type: 'number' }, currency: { type: 'string' }, customer: { type: 'string' }, payment_method: { type: 'string' }, description: { type: 'string' }, metadata: { type: 'object' } }, required: ['amount', 'currency'] } },
  { name: 'stripe_payment_intent_retrieve', description: 'Retrieve a payment intent', inputSchema: { type: 'object', additionalProperties: false, properties: { payment_intent_id: { type: 'string' } }, required: ['payment_intent_id'] } },
  { name: 'stripe_payment_intent_update', description: 'Update a payment intent', inputSchema: { type: 'object', additionalProperties: false, properties: { payment_intent_id: { type: 'string' }, amount: { type: 'number' }, currency: { type: 'string' }, metadata: { type: 'object' } }, required: ['payment_intent_id'] } },
  { name: 'stripe_payment_intent_confirm', description: 'Confirm a payment intent', inputSchema: { type: 'object', additionalProperties: false, properties: { payment_intent_id: { type: 'string' }, payment_method: { type: 'string' } }, required: ['payment_intent_id'] } },
  { name: 'stripe_payment_intent_cancel', description: 'Cancel a payment intent', inputSchema: { type: 'object', additionalProperties: false, properties: { payment_intent_id: { type: 'string' }, cancellation_reason: { type: 'string', enum: ['duplicate', 'fraudulent', 'requested_by_customer', 'abandoned'] } }, required: ['payment_intent_id'] } },
  { name: 'stripe_payment_intent_list', description: 'List payment intents', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, limit: { type: 'number' }, starting_after: { type: 'string' } } } },

  // CHARGES (5 tools)
  { name: 'stripe_charge_create', description: 'Create a charge', inputSchema: { type: 'object', additionalProperties: false, properties: { amount: { type: 'number' }, currency: { type: 'string' }, source: { type: 'string' }, customer: { type: 'string' }, description: { type: 'string' }, metadata: { type: 'object' } }, required: ['amount', 'currency'] } },
  { name: 'stripe_charge_retrieve', description: 'Retrieve a charge', inputSchema: { type: 'object', additionalProperties: false, properties: { charge_id: { type: 'string' } }, required: ['charge_id'] } },
  { name: 'stripe_charge_update', description: 'Update a charge', inputSchema: { type: 'object', additionalProperties: false, properties: { charge_id: { type: 'string' }, description: { type: 'string' }, metadata: { type: 'object' } }, required: ['charge_id'] } },
  { name: 'stripe_charge_capture', description: 'Capture a charge', inputSchema: { type: 'object', additionalProperties: false, properties: { charge_id: { type: 'string' }, amount: { type: 'number' } }, required: ['charge_id'] } },
  { name: 'stripe_charge_list', description: 'List charges', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, limit: { type: 'number' }, starting_after: { type: 'string' } } } },

  // REFUNDS (5 tools)
  { name: 'stripe_refund_create', description: 'Create a refund', inputSchema: { type: 'object', additionalProperties: false, properties: { charge: { type: 'string' }, payment_intent: { type: 'string' }, amount: { type: 'number' }, reason: { type: 'string', enum: ['duplicate', 'fraudulent', 'requested_by_customer'] }, metadata: { type: 'object' } } } },
  { name: 'stripe_refund_retrieve', description: 'Retrieve a refund', inputSchema: { type: 'object', additionalProperties: false, properties: { refund_id: { type: 'string' } }, required: ['refund_id'] } },
  { name: 'stripe_refund_update', description: 'Update a refund', inputSchema: { type: 'object', additionalProperties: false, properties: { refund_id: { type: 'string' }, metadata: { type: 'object' } }, required: ['refund_id'] } },
  { name: 'stripe_refund_cancel', description: 'Cancel a refund', inputSchema: { type: 'object', additionalProperties: false, properties: { refund_id: { type: 'string' } }, required: ['refund_id'] } },
  { name: 'stripe_refund_list', description: 'List refunds', inputSchema: { type: 'object', additionalProperties: false, properties: { charge: { type: 'string' }, payment_intent: { type: 'string' }, limit: { type: 'number' } } } },

  // PAYOUTS (5 tools)
  { name: 'stripe_payout_create', description: 'Create a payout', inputSchema: { type: 'object', additionalProperties: false, properties: { amount: { type: 'number' }, currency: { type: 'string' }, description: { type: 'string' }, metadata: { type: 'object' } }, required: ['amount', 'currency'] } },
  { name: 'stripe_payout_retrieve', description: 'Retrieve a payout', inputSchema: { type: 'object', additionalProperties: false, properties: { payout_id: { type: 'string' } }, required: ['payout_id'] } },
  { name: 'stripe_payout_update', description: 'Update a payout', inputSchema: { type: 'object', additionalProperties: false, properties: { payout_id: { type: 'string' }, metadata: { type: 'object' } }, required: ['payout_id'] } },
  { name: 'stripe_payout_cancel', description: 'Cancel a payout', inputSchema: { type: 'object', additionalProperties: false, properties: { payout_id: { type: 'string' } }, required: ['payout_id'] } },
  { name: 'stripe_payout_list', description: 'List payouts', inputSchema: { type: 'object', additionalProperties: false, properties: { status: { type: 'string', enum: ['pending', 'paid', 'failed', 'canceled'] }, limit: { type: 'number' } } } },

  // BALANCE TRANSACTIONS (3 tools)
  { name: 'stripe_balance_transaction_retrieve', description: 'Retrieve a balance transaction', inputSchema: { type: 'object', additionalProperties: false, properties: { transaction_id: { type: 'string' } }, required: ['transaction_id'] } },
  { name: 'stripe_balance_transaction_list', description: 'List balance transactions', inputSchema: { type: 'object', additionalProperties: false, properties: { type: { type: 'string' }, payout: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'stripe_balance_retrieve', description: 'Retrieve balance', inputSchema: { type: 'object', additionalProperties: false, properties: {} } },

  // ============================================================
  // BILLING (40 tools)
  // ============================================================

  // SUBSCRIPTIONS (7 tools)
  { name: 'stripe_subscription_create', description: 'Create a subscription', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, items: { type: 'array', items: { type: 'object' } }, trial_period_days: { type: 'number' }, default_payment_method: { type: 'string' }, metadata: { type: 'object' } }, required: ['customer', 'items'] } },
  { name: 'stripe_subscription_retrieve', description: 'Retrieve a subscription', inputSchema: { type: 'object', additionalProperties: false, properties: { subscription_id: { type: 'string' } }, required: ['subscription_id'] } },
  { name: 'stripe_subscription_update', description: 'Update a subscription', inputSchema: { type: 'object', additionalProperties: false, properties: { subscription_id: { type: 'string' }, items: { type: 'array', items: { type: 'object' } }, metadata: { type: 'object' } }, required: ['subscription_id'] } },
  { name: 'stripe_subscription_cancel', description: 'Cancel a subscription', inputSchema: { type: 'object', additionalProperties: false, properties: { subscription_id: { type: 'string' }, at_period_end: { type: 'boolean' } }, required: ['subscription_id'] } },
  { name: 'stripe_subscription_resume', description: 'Resume a subscription', inputSchema: { type: 'object', additionalProperties: false, properties: { subscription_id: { type: 'string' } }, required: ['subscription_id'] } },
  { name: 'stripe_subscription_list', description: 'List subscriptions', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, status: { type: 'string', enum: ['active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'all'] }, limit: { type: 'number' } } } },
  { name: 'stripe_subscription_search', description: 'Search subscriptions', inputSchema: { type: 'object', additionalProperties: false, properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] } },

  // SUBSCRIPTION ITEMS (5 tools)
  { name: 'stripe_subscription_item_create', description: 'Create a subscription item', inputSchema: { type: 'object', additionalProperties: false, properties: { subscription: { type: 'string' }, price: { type: 'string' }, quantity: { type: 'number' }, metadata: { type: 'object' } }, required: ['subscription', 'price'] } },
  { name: 'stripe_subscription_item_retrieve', description: 'Retrieve a subscription item', inputSchema: { type: 'object', additionalProperties: false, properties: { item_id: { type: 'string' } }, required: ['item_id'] } },
  { name: 'stripe_subscription_item_update', description: 'Update a subscription item', inputSchema: { type: 'object', additionalProperties: false, properties: { item_id: { type: 'string' }, price: { type: 'string' }, quantity: { type: 'number' }, metadata: { type: 'object' } }, required: ['item_id'] } },
  { name: 'stripe_subscription_item_delete', description: 'Delete a subscription item', inputSchema: { type: 'object', additionalProperties: false, properties: { item_id: { type: 'string' } }, required: ['item_id'] } },
  { name: 'stripe_subscription_item_list', description: 'List subscription items', inputSchema: { type: 'object', additionalProperties: false, properties: { subscription: { type: 'string' }, limit: { type: 'number' } }, required: ['subscription'] } },

  // INVOICES (9 tools)
  { name: 'stripe_invoice_create', description: 'Create an invoice', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, auto_advance: { type: 'boolean' }, collection_method: { type: 'string', enum: ['charge_automatically', 'send_invoice'] }, description: { type: 'string' }, metadata: { type: 'object' } }, required: ['customer'] } },
  { name: 'stripe_invoice_retrieve', description: 'Retrieve an invoice', inputSchema: { type: 'object', additionalProperties: false, properties: { invoice_id: { type: 'string' } }, required: ['invoice_id'] } },
  { name: 'stripe_invoice_update', description: 'Update an invoice', inputSchema: { type: 'object', additionalProperties: false, properties: { invoice_id: { type: 'string' }, description: { type: 'string' }, metadata: { type: 'object' } }, required: ['invoice_id'] } },
  { name: 'stripe_invoice_delete', description: 'Delete a draft invoice', inputSchema: { type: 'object', additionalProperties: false, properties: { invoice_id: { type: 'string' } }, required: ['invoice_id'] } },
  { name: 'stripe_invoice_finalize', description: 'Finalize an invoice', inputSchema: { type: 'object', additionalProperties: false, properties: { invoice_id: { type: 'string' }, auto_advance: { type: 'boolean' } }, required: ['invoice_id'] } },
  { name: 'stripe_invoice_pay', description: 'Pay an invoice', inputSchema: { type: 'object', additionalProperties: false, properties: { invoice_id: { type: 'string' }, paid_out_of_band: { type: 'boolean' } }, required: ['invoice_id'] } },
  { name: 'stripe_invoice_send', description: 'Send an invoice', inputSchema: { type: 'object', additionalProperties: false, properties: { invoice_id: { type: 'string' } }, required: ['invoice_id'] } },
  { name: 'stripe_invoice_void', description: 'Void an invoice', inputSchema: { type: 'object', additionalProperties: false, properties: { invoice_id: { type: 'string' } }, required: ['invoice_id'] } },
  { name: 'stripe_invoice_list', description: 'List invoices', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, status: { type: 'string', enum: ['draft', 'open', 'paid', 'uncollectible', 'void'] }, limit: { type: 'number' } } } },

  // INVOICE ITEMS (5 tools)
  { name: 'stripe_invoice_item_create', description: 'Create an invoice item', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, amount: { type: 'number' }, currency: { type: 'string' }, description: { type: 'string' }, invoice: { type: 'string' }, metadata: { type: 'object' } }, required: ['customer', 'amount', 'currency'] } },
  { name: 'stripe_invoice_item_retrieve', description: 'Retrieve an invoice item', inputSchema: { type: 'object', additionalProperties: false, properties: { item_id: { type: 'string' } }, required: ['item_id'] } },
  { name: 'stripe_invoice_item_update', description: 'Update an invoice item', inputSchema: { type: 'object', additionalProperties: false, properties: { item_id: { type: 'string' }, amount: { type: 'number' }, description: { type: 'string' }, metadata: { type: 'object' } }, required: ['item_id'] } },
  { name: 'stripe_invoice_item_delete', description: 'Delete an invoice item', inputSchema: { type: 'object', additionalProperties: false, properties: { item_id: { type: 'string' } }, required: ['item_id'] } },
  { name: 'stripe_invoice_item_list', description: 'List invoice items', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, invoice: { type: 'string' }, limit: { type: 'number' } } } },

  // PLANS (5 tools) - Deprecated but still used
  { name: 'stripe_plan_create', description: 'Create a plan', inputSchema: { type: 'object', additionalProperties: false, properties: { amount: { type: 'number' }, currency: { type: 'string' }, interval: { type: 'string', enum: ['day', 'week', 'month', 'year'] }, product: { type: 'string' }, nickname: { type: 'string' }, metadata: { type: 'object' } }, required: ['amount', 'currency', 'interval', 'product'] } },
  { name: 'stripe_plan_retrieve', description: 'Retrieve a plan', inputSchema: { type: 'object', additionalProperties: false, properties: { plan_id: { type: 'string' } }, required: ['plan_id'] } },
  { name: 'stripe_plan_update', description: 'Update a plan', inputSchema: { type: 'object', additionalProperties: false, properties: { plan_id: { type: 'string' }, nickname: { type: 'string' }, metadata: { type: 'object' } }, required: ['plan_id'] } },
  { name: 'stripe_plan_delete', description: 'Delete a plan', inputSchema: { type: 'object', additionalProperties: false, properties: { plan_id: { type: 'string' } }, required: ['plan_id'] } },
  { name: 'stripe_plan_list', description: 'List plans', inputSchema: { type: 'object', additionalProperties: false, properties: { product: { type: 'string' }, active: { type: 'boolean' }, limit: { type: 'number' } } } },

  // PRICES (5 tools)
  { name: 'stripe_price_create', description: 'Create a price', inputSchema: { type: 'object', additionalProperties: false, properties: { unit_amount: { type: 'number' }, currency: { type: 'string' }, recurring: { type: 'object' }, product: { type: 'string' }, nickname: { type: 'string' }, metadata: { type: 'object' } }, required: ['currency', 'product'] } },
  { name: 'stripe_price_retrieve', description: 'Retrieve a price', inputSchema: { type: 'object', additionalProperties: false, properties: { price_id: { type: 'string' } }, required: ['price_id'] } },
  { name: 'stripe_price_update', description: 'Update a price', inputSchema: { type: 'object', additionalProperties: false, properties: { price_id: { type: 'string' }, nickname: { type: 'string' }, metadata: { type: 'object' } }, required: ['price_id'] } },
  { name: 'stripe_price_search', description: 'Search prices', inputSchema: { type: 'object', additionalProperties: false, properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] } },
  { name: 'stripe_price_list', description: 'List prices', inputSchema: { type: 'object', additionalProperties: false, properties: { product: { type: 'string' }, active: { type: 'boolean' }, limit: { type: 'number' } } } },

  // CREDIT NOTES (4 tools)
  { name: 'stripe_credit_note_create', description: 'Create a credit note', inputSchema: { type: 'object', additionalProperties: false, properties: { invoice: { type: 'string' }, lines: { type: 'array', items: { type: 'object' } }, amount: { type: 'number' }, memo: { type: 'string' }, metadata: { type: 'object' } }, required: ['invoice'] } },
  { name: 'stripe_credit_note_retrieve', description: 'Retrieve a credit note', inputSchema: { type: 'object', additionalProperties: false, properties: { credit_note_id: { type: 'string' } }, required: ['credit_note_id'] } },
  { name: 'stripe_credit_note_void', description: 'Void a credit note', inputSchema: { type: 'object', additionalProperties: false, properties: { credit_note_id: { type: 'string' } }, required: ['credit_note_id'] } },
  { name: 'stripe_credit_note_list', description: 'List credit notes', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, invoice: { type: 'string' }, limit: { type: 'number' } } } },

  // ============================================================
  // PRODUCTS (20 tools)
  // ============================================================

  // PRODUCTS (6 tools)
  { name: 'stripe_product_create', description: 'Create a product', inputSchema: { type: 'object', additionalProperties: false, properties: { name: { type: 'string' }, description: { type: 'string' }, active: { type: 'boolean' }, metadata: { type: 'object' }, images: { type: 'array', items: { type: 'string' } } }, required: ['name'] } },
  { name: 'stripe_product_retrieve', description: 'Retrieve a product', inputSchema: { type: 'object', additionalProperties: false, properties: { product_id: { type: 'string' } }, required: ['product_id'] } },
  { name: 'stripe_product_update', description: 'Update a product', inputSchema: { type: 'object', additionalProperties: false, properties: { product_id: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, active: { type: 'boolean' }, metadata: { type: 'object' } }, required: ['product_id'] } },
  { name: 'stripe_product_delete', description: 'Delete a product', inputSchema: { type: 'object', additionalProperties: false, properties: { product_id: { type: 'string' } }, required: ['product_id'] } },
  { name: 'stripe_product_list', description: 'List products', inputSchema: { type: 'object', additionalProperties: false, properties: { active: { type: 'boolean' }, limit: { type: 'number' }, starting_after: { type: 'string' } } } },
  { name: 'stripe_product_search', description: 'Search products', inputSchema: { type: 'object', additionalProperties: false, properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] } },

  // COUPONS (5 tools)
  { name: 'stripe_coupon_create', description: 'Create a coupon', inputSchema: { type: 'object', additionalProperties: false, properties: { percent_off: { type: 'number' }, amount_off: { type: 'number' }, currency: { type: 'string' }, duration: { type: 'string', enum: ['forever', 'once', 'repeating'] }, duration_in_months: { type: 'number' }, name: { type: 'string' }, metadata: { type: 'object' } } } },
  { name: 'stripe_coupon_retrieve', description: 'Retrieve a coupon', inputSchema: { type: 'object', additionalProperties: false, properties: { coupon_id: { type: 'string' } }, required: ['coupon_id'] } },
  { name: 'stripe_coupon_update', description: 'Update a coupon', inputSchema: { type: 'object', additionalProperties: false, properties: { coupon_id: { type: 'string' }, name: { type: 'string' }, metadata: { type: 'object' } }, required: ['coupon_id'] } },
  { name: 'stripe_coupon_delete', description: 'Delete a coupon', inputSchema: { type: 'object', additionalProperties: false, properties: { coupon_id: { type: 'string' } }, required: ['coupon_id'] } },
  { name: 'stripe_coupon_list', description: 'List coupons', inputSchema: { type: 'object', additionalProperties: false, properties: { limit: { type: 'number' }, starting_after: { type: 'string' } } } },

  // PROMOTION CODES (4 tools)
  { name: 'stripe_promotion_code_create', description: 'Create a promotion code', inputSchema: { type: 'object', additionalProperties: false, properties: { coupon: { type: 'string' }, code: { type: 'string' }, active: { type: 'boolean' }, max_redemptions: { type: 'number' }, metadata: { type: 'object' } }, required: ['coupon'] } },
  { name: 'stripe_promotion_code_retrieve', description: 'Retrieve a promotion code', inputSchema: { type: 'object', additionalProperties: false, properties: { code_id: { type: 'string' } }, required: ['code_id'] } },
  { name: 'stripe_promotion_code_update', description: 'Update a promotion code', inputSchema: { type: 'object', additionalProperties: false, properties: { code_id: { type: 'string' }, active: { type: 'boolean' }, metadata: { type: 'object' } }, required: ['code_id'] } },
  { name: 'stripe_promotion_code_list', description: 'List promotion codes', inputSchema: { type: 'object', additionalProperties: false, properties: { coupon: { type: 'string' }, active: { type: 'boolean' }, limit: { type: 'number' } } } },

  // TAX RATES (5 tools)
  { name: 'stripe_tax_rate_create', description: 'Create a tax rate', inputSchema: { type: 'object', additionalProperties: false, properties: { display_name: { type: 'string' }, percentage: { type: 'number' }, inclusive: { type: 'boolean' }, description: { type: 'string' }, jurisdiction: { type: 'string' }, metadata: { type: 'object' } }, required: ['display_name', 'percentage', 'inclusive'] } },
  { name: 'stripe_tax_rate_retrieve', description: 'Retrieve a tax rate', inputSchema: { type: 'object', additionalProperties: false, properties: { tax_rate_id: { type: 'string' } }, required: ['tax_rate_id'] } },
  { name: 'stripe_tax_rate_update', description: 'Update a tax rate', inputSchema: { type: 'object', additionalProperties: false, properties: { tax_rate_id: { type: 'string' }, display_name: { type: 'string' }, description: { type: 'string' }, metadata: { type: 'object' } }, required: ['tax_rate_id'] } },
  { name: 'stripe_tax_rate_list', description: 'List tax rates', inputSchema: { type: 'object', additionalProperties: false, properties: { active: { type: 'boolean' }, inclusive: { type: 'boolean' }, limit: { type: 'number' } } } },
  { name: 'stripe_tax_rate_delete', description: 'Delete a tax rate', inputSchema: { type: 'object', additionalProperties: false, properties: { tax_rate_id: { type: 'string' } }, required: ['tax_rate_id'] } },

  // ============================================================
  // PAYMENT METHODS (20 tools)
  // ============================================================

  // PAYMENT METHODS (6 tools)
  { name: 'stripe_payment_method_create', description: 'Create a payment method', inputSchema: { type: 'object', additionalProperties: false, properties: { type: { type: 'string', enum: ['card', 'us_bank_account', 'sepa_debit', 'ideal', 'acss_debit'] }, card: { type: 'object' }, billing_details: { type: 'object' }, metadata: { type: 'object' } }, required: ['type'] } },
  { name: 'stripe_payment_method_retrieve', description: 'Retrieve a payment method', inputSchema: { type: 'object', additionalProperties: false, properties: { payment_method_id: { type: 'string' } }, required: ['payment_method_id'] } },
  { name: 'stripe_payment_method_update', description: 'Update a payment method', inputSchema: { type: 'object', additionalProperties: false, properties: { payment_method_id: { type: 'string' }, billing_details: { type: 'object' }, metadata: { type: 'object' } }, required: ['payment_method_id'] } },
  { name: 'stripe_payment_method_attach', description: 'Attach a payment method to a customer', inputSchema: { type: 'object', additionalProperties: false, properties: { payment_method_id: { type: 'string' }, customer: { type: 'string' } }, required: ['payment_method_id', 'customer'] } },
  { name: 'stripe_payment_method_detach', description: 'Detach a payment method from a customer', inputSchema: { type: 'object', additionalProperties: false, properties: { payment_method_id: { type: 'string' } }, required: ['payment_method_id'] } },
  { name: 'stripe_payment_method_list', description: 'List payment methods', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, type: { type: 'string' }, limit: { type: 'number' } }, required: ['customer'] } },

  // CARDS (5 tools)
  { name: 'stripe_card_create', description: 'Create a card', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, source: { type: 'string' }, metadata: { type: 'object' } }, required: ['customer', 'source'] } },
  { name: 'stripe_card_retrieve', description: 'Retrieve a card', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, card_id: { type: 'string' } }, required: ['customer', 'card_id'] } },
  { name: 'stripe_card_update', description: 'Update a card', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, card_id: { type: 'string' }, name: { type: 'string' }, exp_month: { type: 'number' }, exp_year: { type: 'number' }, metadata: { type: 'object' } }, required: ['customer', 'card_id'] } },
  { name: 'stripe_card_delete', description: 'Delete a card', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, card_id: { type: 'string' } }, required: ['customer', 'card_id'] } },
  { name: 'stripe_card_list', description: 'List cards', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, limit: { type: 'number' } }, required: ['customer'] } },

  // BANK ACCOUNTS (5 tools)
  { name: 'stripe_bank_account_create', description: 'Create a bank account', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, source: { type: 'string' }, metadata: { type: 'object' } }, required: ['customer', 'source'] } },
  { name: 'stripe_bank_account_retrieve', description: 'Retrieve a bank account', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, bank_account_id: { type: 'string' } }, required: ['customer', 'bank_account_id'] } },
  { name: 'stripe_bank_account_update', description: 'Update a bank account', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, bank_account_id: { type: 'string' }, account_holder_name: { type: 'string' }, metadata: { type: 'object' } }, required: ['customer', 'bank_account_id'] } },
  { name: 'stripe_bank_account_verify', description: 'Verify a bank account', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, bank_account_id: { type: 'string' }, amounts: { type: 'array', items: { type: 'number' } } }, required: ['customer', 'bank_account_id', 'amounts'] } },
  { name: 'stripe_bank_account_delete', description: 'Delete a bank account', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, bank_account_id: { type: 'string' } }, required: ['customer', 'bank_account_id'] } },

  // SOURCES (4 tools)
  { name: 'stripe_source_create', description: 'Create a source', inputSchema: { type: 'object', additionalProperties: false, properties: { type: { type: 'string' }, amount: { type: 'number' }, currency: { type: 'string' }, owner: { type: 'object' }, metadata: { type: 'object' } }, required: ['type', 'currency'] } },
  { name: 'stripe_source_retrieve', description: 'Retrieve a source', inputSchema: { type: 'object', additionalProperties: false, properties: { source_id: { type: 'string' } }, required: ['source_id'] } },
  { name: 'stripe_source_update', description: 'Update a source', inputSchema: { type: 'object', additionalProperties: false, properties: { source_id: { type: 'string' }, owner: { type: 'object' }, metadata: { type: 'object' } }, required: ['source_id'] } },
  { name: 'stripe_source_detach', description: 'Detach a source from a customer', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, source_id: { type: 'string' } }, required: ['customer', 'source_id'] } },

  // ============================================================
  // CONNECT (20 tools)
  // ============================================================

  // ACCOUNTS (5 tools)
  { name: 'stripe_account_create', description: 'Create a connected account', inputSchema: { type: 'object', additionalProperties: false, properties: { type: { type: 'string', enum: ['custom', 'express', 'standard'] }, country: { type: 'string' }, email: { type: 'string' }, capabilities: { type: 'object' }, metadata: { type: 'object' } } } },
  { name: 'stripe_account_retrieve', description: 'Retrieve an account', inputSchema: { type: 'object', additionalProperties: false, properties: { account_id: { type: 'string' } } } },
  { name: 'stripe_account_update', description: 'Update an account', inputSchema: { type: 'object', additionalProperties: false, properties: { account_id: { type: 'string' }, business_profile: { type: 'object' }, settings: { type: 'object' }, metadata: { type: 'object' } } } },
  { name: 'stripe_account_delete', description: 'Delete an account', inputSchema: { type: 'object', additionalProperties: false, properties: { account_id: { type: 'string' } }, required: ['account_id'] } },
  { name: 'stripe_account_list', description: 'List accounts', inputSchema: { type: 'object', additionalProperties: false, properties: { limit: { type: 'number' }, starting_after: { type: 'string' } } } },

  // TRANSFERS (5 tools)
  { name: 'stripe_transfer_create', description: 'Create a transfer', inputSchema: { type: 'object', additionalProperties: false, properties: { amount: { type: 'number' }, currency: { type: 'string' }, destination: { type: 'string' }, description: { type: 'string' }, metadata: { type: 'object' } }, required: ['amount', 'currency', 'destination'] } },
  { name: 'stripe_transfer_retrieve', description: 'Retrieve a transfer', inputSchema: { type: 'object', additionalProperties: false, properties: { transfer_id: { type: 'string' } }, required: ['transfer_id'] } },
  { name: 'stripe_transfer_update', description: 'Update a transfer', inputSchema: { type: 'object', additionalProperties: false, properties: { transfer_id: { type: 'string' }, description: { type: 'string' }, metadata: { type: 'object' } }, required: ['transfer_id'] } },
  { name: 'stripe_transfer_reverse', description: 'Reverse a transfer', inputSchema: { type: 'object', additionalProperties: false, properties: { transfer_id: { type: 'string' }, amount: { type: 'number' }, description: { type: 'string' }, metadata: { type: 'object' } }, required: ['transfer_id'] } },
  { name: 'stripe_transfer_list', description: 'List transfers', inputSchema: { type: 'object', additionalProperties: false, properties: { destination: { type: 'string' }, limit: { type: 'number' } } } },

  // APPLICATION FEES (3 tools)
  { name: 'stripe_application_fee_retrieve', description: 'Retrieve an application fee', inputSchema: { type: 'object', additionalProperties: false, properties: { fee_id: { type: 'string' } }, required: ['fee_id'] } },
  { name: 'stripe_application_fee_refund', description: 'Refund an application fee', inputSchema: { type: 'object', additionalProperties: false, properties: { fee_id: { type: 'string' }, amount: { type: 'number' } }, required: ['fee_id'] } },
  { name: 'stripe_application_fee_list', description: 'List application fees', inputSchema: { type: 'object', additionalProperties: false, properties: { charge: { type: 'string' }, limit: { type: 'number' } } } },

  // CAPABILITIES (3 tools)
  { name: 'stripe_capability_retrieve', description: 'Retrieve a capability', inputSchema: { type: 'object', additionalProperties: false, properties: { account_id: { type: 'string' }, capability_id: { type: 'string' } }, required: ['account_id', 'capability_id'] } },
  { name: 'stripe_capability_update', description: 'Update a capability', inputSchema: { type: 'object', additionalProperties: false, properties: { account_id: { type: 'string' }, capability_id: { type: 'string' }, requested: { type: 'boolean' } }, required: ['account_id', 'capability_id'] } },
  { name: 'stripe_capability_list', description: 'List capabilities', inputSchema: { type: 'object', additionalProperties: false, properties: { account_id: { type: 'string' } }, required: ['account_id'] } },

  // ACCOUNT LINKS (2 tools)
  { name: 'stripe_account_link_create', description: 'Create an account link', inputSchema: { type: 'object', additionalProperties: false, properties: { account: { type: 'string' }, refresh_url: { type: 'string' }, return_url: { type: 'string' }, type: { type: 'string', enum: ['account_onboarding', 'account_update'] } }, required: ['account', 'refresh_url', 'return_url', 'type'] } },
  { name: 'stripe_account_session_create', description: 'Create an account session', inputSchema: { type: 'object', additionalProperties: false, properties: { account: { type: 'string' }, components: { type: 'object' } }, required: ['account', 'components'] } },

  // EXTERNAL ACCOUNTS (2 tools)
  { name: 'stripe_external_account_create', description: 'Create an external account', inputSchema: { type: 'object', additionalProperties: false, properties: { account_id: { type: 'string' }, external_account: { type: 'string' }, metadata: { type: 'object' } }, required: ['account_id', 'external_account'] } },
  { name: 'stripe_external_account_delete', description: 'Delete an external account', inputSchema: { type: 'object', additionalProperties: false, properties: { account_id: { type: 'string' }, external_account_id: { type: 'string' } }, required: ['account_id', 'external_account_id'] } },

  // ============================================================
  // OTHER (20 tools)
  // ============================================================

  // EVENTS (2 tools)
  { name: 'stripe_event_retrieve', description: 'Retrieve an event', inputSchema: { type: 'object', additionalProperties: false, properties: { event_id: { type: 'string' } }, required: ['event_id'] } },
  { name: 'stripe_event_list', description: 'List events', inputSchema: { type: 'object', additionalProperties: false, properties: { type: { type: 'string' }, limit: { type: 'number' }, starting_after: { type: 'string' } } } },

  // FILES (3 tools)
  { name: 'stripe_file_create', description: 'Create a file', inputSchema: { type: 'object', additionalProperties: false, properties: { file: { type: 'string' }, purpose: { type: 'string', enum: ['account_requirement', 'additional_verification', 'business_icon', 'business_logo', 'customer_signature', 'dispute_evidence', 'identity_document', 'pci_document', 'tax_document_user_upload'] } }, required: ['file', 'purpose'] } },
  { name: 'stripe_file_retrieve', description: 'Retrieve a file', inputSchema: { type: 'object', additionalProperties: false, properties: { file_id: { type: 'string' } }, required: ['file_id'] } },
  { name: 'stripe_file_list', description: 'List files', inputSchema: { type: 'object', additionalProperties: false, properties: { purpose: { type: 'string' }, limit: { type: 'number' } } } },

  // DISPUTES (4 tools)
  { name: 'stripe_dispute_retrieve', description: 'Retrieve a dispute', inputSchema: { type: 'object', additionalProperties: false, properties: { dispute_id: { type: 'string' } }, required: ['dispute_id'] } },
  { name: 'stripe_dispute_update', description: 'Update a dispute', inputSchema: { type: 'object', additionalProperties: false, properties: { dispute_id: { type: 'string' }, evidence: { type: 'object' }, metadata: { type: 'object' } }, required: ['dispute_id'] } },
  { name: 'stripe_dispute_close', description: 'Close a dispute', inputSchema: { type: 'object', additionalProperties: false, properties: { dispute_id: { type: 'string' } }, required: ['dispute_id'] } },
  { name: 'stripe_dispute_list', description: 'List disputes', inputSchema: { type: 'object', additionalProperties: false, properties: { charge: { type: 'string' }, payment_intent: { type: 'string' }, limit: { type: 'number' } } } },

  // WEBHOOKS (2 tools)
  { name: 'stripe_webhook_construct_event', description: 'Construct a webhook event', inputSchema: { type: 'object', additionalProperties: false, properties: { payload: { type: 'string' }, signature: { type: 'string' }, secret: { type: 'string' } }, required: ['payload', 'signature', 'secret'] } },
  { name: 'stripe_webhook_verify_signature', description: 'Verify a webhook signature', inputSchema: { type: 'object', additionalProperties: false, properties: { payload: { type: 'string' }, signature: { type: 'string' }, secret: { type: 'string' } }, required: ['payload', 'signature', 'secret'] } },

  // SETUP INTENTS (5 tools)
  { name: 'stripe_setup_intent_create', description: 'Create a setup intent', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, payment_method_types: { type: 'array', items: { type: 'string' } }, usage: { type: 'string', enum: ['off_session', 'on_session'] }, metadata: { type: 'object' } } } },
  { name: 'stripe_setup_intent_retrieve', description: 'Retrieve a setup intent', inputSchema: { type: 'object', additionalProperties: false, properties: { setup_intent_id: { type: 'string' } }, required: ['setup_intent_id'] } },
  { name: 'stripe_setup_intent_update', description: 'Update a setup intent', inputSchema: { type: 'object', additionalProperties: false, properties: { setup_intent_id: { type: 'string' }, customer: { type: 'string' }, metadata: { type: 'object' } }, required: ['setup_intent_id'] } },
  { name: 'stripe_setup_intent_confirm', description: 'Confirm a setup intent', inputSchema: { type: 'object', additionalProperties: false, properties: { setup_intent_id: { type: 'string' }, payment_method: { type: 'string' } }, required: ['setup_intent_id'] } },
  { name: 'stripe_setup_intent_cancel', description: 'Cancel a setup intent', inputSchema: { type: 'object', additionalProperties: false, properties: { setup_intent_id: { type: 'string' }, cancellation_reason: { type: 'string', enum: ['abandoned', 'requested_by_customer', 'duplicate'] } }, required: ['setup_intent_id'] } },

  // CHECKOUT SESSIONS (4 tools)
  { name: 'stripe_checkout_session_create', description: 'Create a checkout session', inputSchema: { type: 'object', additionalProperties: false, properties: { line_items: { type: 'array', items: { type: 'object' } }, mode: { type: 'string', enum: ['payment', 'setup', 'subscription'] }, success_url: { type: 'string' }, cancel_url: { type: 'string' }, customer: { type: 'string' }, metadata: { type: 'object' } }, required: ['line_items', 'mode', 'success_url'] } },
  { name: 'stripe_checkout_session_retrieve', description: 'Retrieve a checkout session', inputSchema: { type: 'object', additionalProperties: false, properties: { session_id: { type: 'string' } }, required: ['session_id'] } },
  { name: 'stripe_checkout_session_expire', description: 'Expire a checkout session', inputSchema: { type: 'object', additionalProperties: false, properties: { session_id: { type: 'string' } }, required: ['session_id'] } },
  { name: 'stripe_checkout_session_list', description: 'List checkout sessions', inputSchema: { type: 'object', additionalProperties: false, properties: { customer: { type: 'string' }, payment_intent: { type: 'string' }, subscription: { type: 'string' }, limit: { type: 'number' } } } },
];

