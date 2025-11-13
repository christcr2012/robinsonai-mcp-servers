// Stripe Handler Methods Part 2 - Products, Payment Methods, Connect, Other
// These methods will be added to the UnifiedToolkit class

// Helper function to format Stripe responses
function formatStripeResponse(result: any) {
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ============================================================
// PRODUCTS HANDLERS (20 handlers)
// ============================================================

// PRODUCTS (6 handlers)
export async function stripeProductCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const product = await this.stripeClient.products.create(args);
    return formatStripeResponse(product);
  } catch (error: any) {
    throw new Error(`Failed to create product: ${error.message}`);
  }
}

export async function stripeProductRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const product = await this.stripeClient.products.retrieve(args.product_id);
    return formatStripeResponse(product);
  } catch (error: any) {
    throw new Error(`Failed to retrieve product: ${error.message}`);
  }
}

export async function stripeProductUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { product_id, ...updateData } = args;
    const product = await this.stripeClient.products.update(product_id, updateData);
    return formatStripeResponse(product);
  } catch (error: any) {
    throw new Error(`Failed to update product: ${error.message}`);
  }
}

export async function stripeProductDelete(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const result = await this.stripeClient.products.del(args.product_id);
    return formatStripeResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }
}

export async function stripeProductList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const products = await this.stripeClient.products.list(args);
    return formatStripeResponse(products);
  } catch (error: any) {
    throw new Error(`Failed to list products: ${error.message}`);
  }
}

export async function stripeProductSearch(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const products = await this.stripeClient.products.search(args);
    return formatStripeResponse(products);
  } catch (error: any) {
    throw new Error(`Failed to search products: ${error.message}`);
  }
}

// COUPONS (5 handlers)
export async function stripeCouponCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const coupon = await this.stripeClient.coupons.create(args);
    return formatStripeResponse(coupon);
  } catch (error: any) {
    throw new Error(`Failed to create coupon: ${error.message}`);
  }
}

export async function stripeCouponRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const coupon = await this.stripeClient.coupons.retrieve(args.coupon_id);
    return formatStripeResponse(coupon);
  } catch (error: any) {
    throw new Error(`Failed to retrieve coupon: ${error.message}`);
  }
}

export async function stripeCouponUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { coupon_id, ...updateData } = args;
    const coupon = await this.stripeClient.coupons.update(coupon_id, updateData);
    return formatStripeResponse(coupon);
  } catch (error: any) {
    throw new Error(`Failed to update coupon: ${error.message}`);
  }
}

export async function stripeCouponDelete(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const result = await this.stripeClient.coupons.del(args.coupon_id);
    return formatStripeResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to delete coupon: ${error.message}`);
  }
}

export async function stripeCouponList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const coupons = await this.stripeClient.coupons.list(args);
    return formatStripeResponse(coupons);
  } catch (error: any) {
    throw new Error(`Failed to list coupons: ${error.message}`);
  }
}

// PROMOTION CODES (4 handlers)
export async function stripePromotionCodeCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const code = await this.stripeClient.promotionCodes.create(args);
    return formatStripeResponse(code);
  } catch (error: any) {
    throw new Error(`Failed to create promotion code: ${error.message}`);
  }
}

export async function stripePromotionCodeRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const code = await this.stripeClient.promotionCodes.retrieve(args.code_id);
    return formatStripeResponse(code);
  } catch (error: any) {
    throw new Error(`Failed to retrieve promotion code: ${error.message}`);
  }
}

export async function stripePromotionCodeUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { code_id, ...updateData } = args;
    const code = await this.stripeClient.promotionCodes.update(code_id, updateData);
    return formatStripeResponse(code);
  } catch (error: any) {
    throw new Error(`Failed to update promotion code: ${error.message}`);
  }
}

export async function stripePromotionCodeList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const codes = await this.stripeClient.promotionCodes.list(args);
    return formatStripeResponse(codes);
  } catch (error: any) {
    throw new Error(`Failed to list promotion codes: ${error.message}`);
  }
}

// TAX RATES (5 handlers)
export async function stripeTaxRateCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const taxRate = await this.stripeClient.taxRates.create(args);
    return formatStripeResponse(taxRate);
  } catch (error: any) {
    throw new Error(`Failed to create tax rate: ${error.message}`);
  }
}

export async function stripeTaxRateRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const taxRate = await this.stripeClient.taxRates.retrieve(args.tax_rate_id);
    return formatStripeResponse(taxRate);
  } catch (error: any) {
    throw new Error(`Failed to retrieve tax rate: ${error.message}`);
  }
}

export async function stripeTaxRateUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { tax_rate_id, ...updateData } = args;
    const taxRate = await this.stripeClient.taxRates.update(tax_rate_id, updateData);
    return formatStripeResponse(taxRate);
  } catch (error: any) {
    throw new Error(`Failed to update tax rate: ${error.message}`);
  }
}

export async function stripeTaxRateList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const taxRates = await this.stripeClient.taxRates.list(args);
    return formatStripeResponse(taxRates);
  } catch (error: any) {
    throw new Error(`Failed to list tax rates: ${error.message}`);
  }
}

export async function stripeTaxRateDelete(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const result = await this.stripeClient.taxRates.del(args.tax_rate_id);
    return formatStripeResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to delete tax rate: ${error.message}`);
  }
}

// ============================================================
// PAYMENT METHODS HANDLERS (20 handlers)
// ============================================================

// PAYMENT METHODS (6 handlers)
export async function stripePaymentMethodCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const paymentMethod = await this.stripeClient.paymentMethods.create(args);
    return formatStripeResponse(paymentMethod);
  } catch (error: any) {
    throw new Error(`Failed to create payment method: ${error.message}`);
  }
}

export async function stripePaymentMethodRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const paymentMethod = await this.stripeClient.paymentMethods.retrieve(args.payment_method_id);
    return formatStripeResponse(paymentMethod);
  } catch (error: any) {
    throw new Error(`Failed to retrieve payment method: ${error.message}`);
  }
}

export async function stripePaymentMethodUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { payment_method_id, ...updateData } = args;
    const paymentMethod = await this.stripeClient.paymentMethods.update(payment_method_id, updateData);
    return formatStripeResponse(paymentMethod);
  } catch (error: any) {
    throw new Error(`Failed to update payment method: ${error.message}`);
  }
}

export async function stripePaymentMethodAttach(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { payment_method_id, customer } = args;
    const paymentMethod = await this.stripeClient.paymentMethods.attach(payment_method_id, { customer });
    return formatStripeResponse(paymentMethod);
  } catch (error: any) {
    throw new Error(`Failed to attach payment method: ${error.message}`);
  }
}

export async function stripePaymentMethodDetach(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const paymentMethod = await this.stripeClient.paymentMethods.detach(args.payment_method_id);
    return formatStripeResponse(paymentMethod);
  } catch (error: any) {
    throw new Error(`Failed to detach payment method: ${error.message}`);
  }
}

export async function stripePaymentMethodList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const paymentMethods = await this.stripeClient.paymentMethods.list(args);
    return formatStripeResponse(paymentMethods);
  } catch (error: any) {
    throw new Error(`Failed to list payment methods: ${error.message}`);
  }
}

// CARDS (5 handlers)
export async function stripeCardCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customer, ...cardData } = args;
    const card = await this.stripeClient.customers.createSource(customer, cardData);
    return formatStripeResponse(card);
  } catch (error: any) {
    throw new Error(`Failed to create card: ${error.message}`);
  }
}

export async function stripeCardRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customer, card_id } = args;
    const card = await this.stripeClient.customers.retrieveSource(customer, card_id);
    return formatStripeResponse(card);
  } catch (error: any) {
    throw new Error(`Failed to retrieve card: ${error.message}`);
  }
}

export async function stripeCardUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customer, card_id, ...updateData } = args;
    const card = await this.stripeClient.customers.updateSource(customer, card_id, updateData);
    return formatStripeResponse(card);
  } catch (error: any) {
    throw new Error(`Failed to update card: ${error.message}`);
  }
}

export async function stripeCardDelete(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customer, card_id } = args;
    const result = await this.stripeClient.customers.deleteSource(customer, card_id);
    return formatStripeResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to delete card: ${error.message}`);
  }
}

export async function stripeCardList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customer, ...listParams } = args;
    const cards = await this.stripeClient.customers.listSources(customer, { object: 'card', ...listParams });
    return formatStripeResponse(cards);
  } catch (error: any) {
    throw new Error(`Failed to list cards: ${error.message}`);
  }
}

// BANK ACCOUNTS (5 handlers)
export async function stripeBankAccountCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customer, ...accountData } = args;
    const account = await this.stripeClient.customers.createSource(customer, accountData);
    return formatStripeResponse(account);
  } catch (error: any) {
    throw new Error(`Failed to create bank account: ${error.message}`);
  }
}

export async function stripeBankAccountRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customer, bank_account_id } = args;
    const account = await this.stripeClient.customers.retrieveSource(customer, bank_account_id);
    return formatStripeResponse(account);
  } catch (error: any) {
    throw new Error(`Failed to retrieve bank account: ${error.message}`);
  }
}

export async function stripeBankAccountUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customer, bank_account_id, ...updateData } = args;
    const account = await this.stripeClient.customers.updateSource(customer, bank_account_id, updateData);
    return formatStripeResponse(account);
  } catch (error: any) {
    throw new Error(`Failed to update bank account: ${error.message}`);
  }
}

export async function stripeBankAccountVerify(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customer, bank_account_id, amounts } = args;
    const account = await this.stripeClient.customers.verifySource(customer, bank_account_id, { amounts });
    return formatStripeResponse(account);
  } catch (error: any) {
    throw new Error(`Failed to verify bank account: ${error.message}`);
  }
}

export async function stripeBankAccountDelete(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customer, bank_account_id } = args;
    const result = await this.stripeClient.customers.deleteSource(customer, bank_account_id);
    return formatStripeResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to delete bank account: ${error.message}`);
  }
}

// SOURCES (4 handlers)
export async function stripeSourceCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const source = await this.stripeClient.sources.create(args);
    return formatStripeResponse(source);
  } catch (error: any) {
    throw new Error(`Failed to create source: ${error.message}`);
  }
}

export async function stripeSourceRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const source = await this.stripeClient.sources.retrieve(args.source_id);
    return formatStripeResponse(source);
  } catch (error: any) {
    throw new Error(`Failed to retrieve source: ${error.message}`);
  }
}

export async function stripeSourceUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { source_id, ...updateData } = args;
    const source = await this.stripeClient.sources.update(source_id, updateData);
    return formatStripeResponse(source);
  } catch (error: any) {
    throw new Error(`Failed to update source: ${error.message}`);
  }
}

export async function stripeSourceDetach(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customer, source_id } = args;
    const result = await this.stripeClient.customers.deleteSource(customer, source_id);
    return formatStripeResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to detach source: ${error.message}`);
  }
}

