// =============================================================================
// DODO PAYMENTS CLIENT
// =============================================================================
//
// This module provides a centralized Dodo Payments client for the application.
// All payment-related operations should go through this client.
//
// WALLET-BASED BILLING MODEL:
// ===========================
// Guffles uses a hybrid subscription + wallet model:
// 1. User subscribes to a plan (Pro $79, Growth $179, Scale $279)
// 2. Each billing cycle, wallet is RESET to plan's credit amount
// 3. Users spend credits on actions (analysis, enrichment, search)
// 4. Unused credits are FORFEITED at end of billing cycle (no rollover)
//
// PLAN CREDIT ALLOCATION:
// =======================
// | Plan   | Price   | Credits | Breakdown                    |
// |--------|---------|---------|------------------------------|
// | Pro    | $79/mo  | $150    | $100 base + $50 bonus        |
// | Growth | $179/mo | $300    | $200 base + $100 bonus       |
// | Scale  | $279/mo | $500    | $300 base + $200 bonus       |
//
// IMPORTANT SECURITY NOTES:
// - Never log full API responses in production (may contain sensitive data)
// - Always use the server-side client (never expose API key to client)
// - Webhook signatures MUST be verified before processing events
//
// Created: 2nd January 2026
// Last Updated: 2nd January 2026 - Wallet-based billing model
// =============================================================================

import DodoPayments from 'dodopayments';

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

/**
 * Validates that required Dodo environment variables are set.
 * Throws an error if any required variable is missing.
 *
 * Call this during app initialization to fail fast if misconfigured.
 */
export function validateDodoEnvironment(): void {
  const requiredVars = ['DODO_API_KEY', 'DODO_WEBHOOK_SECRET'];
  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Dodo environment variables: ${missing.join(', ')}. ` +
      `Please add them to your .env file.`
    );
  }
}

// =============================================================================
// CLIENT SINGLETON
// =============================================================================

// Cached client instance for reuse across requests
let _dodoClient: DodoPayments | null = null;

/**
 * Returns a singleton instance of the Dodo Payments client.
 *
 * The client is lazily initialized on first call and reused thereafter.
 * This pattern avoids creating multiple client instances and ensures
 * consistent configuration across the application.
 *
 * @throws Error if DODO_API_KEY is not set
 *
 * @example
 * ```typescript
 * const client = getDodoClient();
 * const customer = await client.customers.create({ email, name });
 * ```
 */
export function getDodoClient(): DodoPayments {
  if (!_dodoClient) {
    const apiKey = process.env.DODO_API_KEY;

    if (!apiKey) {
      throw new Error(
        'DODO_API_KEY environment variable is not set. ' +
        'Please add it to your .env file.'
      );
    }

    _dodoClient = new DodoPayments({
      bearerToken: apiKey,
    });
  }

  return _dodoClient;
}

// =============================================================================
// PRODUCT ID MAPPING
// =============================================================================
//
// Maps internal plan IDs to Dodo subscription product IDs.
//
// WALLET-BASED PLANS:
// ===================
// | Plan   | Monthly Price | Wallet Credits | Dodo Product Naming      |
// |--------|---------------|----------------|--------------------------|
// | Pro    | $79           | $150           | guffles_pro_monthly      |
// | Growth | $179          | $300           | guffles_growth_monthly   |
// | Scale  | $279          | $500           | guffles_scale_monthly    |
//
// IMPORTANT: Create these products in Dodo dashboard first!
// - Type: Subscription (recurring)
// - Billing: Monthly
// - Tax category: digital_products
// =============================================================================

/**
 * Maps internal plan IDs to Dodo product IDs.
 *
 * These are SUBSCRIPTION products that charge monthly.
 * When payment succeeds, we reset the user's wallet to the plan's credit amount.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create products in Dodo dashboard
 * 2. Copy the product IDs (format: prd_xxxxx)
 * 3. Add to .env file as DODO_PRODUCT_PRO_MONTHLY, etc.
 *
 * NOTE: We only support monthly billing for wallet-based plans.
 * Annual plans would need different wallet reset logic.
 */
export const DODO_PRODUCT_IDS: Record<string, string> = {
  // -------------------------------------------------------------------------
  // PRO PLAN ($79/month → $150 wallet credits)
  // -------------------------------------------------------------------------
  // Best for: Solo founders and SDRs discovering intent-based leads
  // -------------------------------------------------------------------------
  pro: process.env.DODO_PRODUCT_PRO_MONTHLY || 'prd_pro_monthly_placeholder',

  // -------------------------------------------------------------------------
  // GROWTH PLAN ($179/month → $300 wallet credits)
  // -------------------------------------------------------------------------
  // Best for: Sales teams capturing buying signals at scale
  // -------------------------------------------------------------------------
  growth: process.env.DODO_PRODUCT_GROWTH_MONTHLY || 'prd_growth_monthly_placeholder',

  // -------------------------------------------------------------------------
  // SCALE PLAN ($279/month → $500 wallet credits)
  // -------------------------------------------------------------------------
  // Best for: Agencies running intent-based campaigns for clients
  // -------------------------------------------------------------------------
  scale: process.env.DODO_PRODUCT_SCALE_MONTHLY || 'prd_scale_monthly_placeholder',
};

/**
 * Gets the Dodo product ID for a given plan.
 *
 * NOTE: All wallet-based plans are monthly only.
 *
 * @param planId - The internal plan ID (pro, growth, scale)
 * @returns The Dodo product ID
 * @throws Error if the plan is invalid
 *
 * @example
 * const productId = getDodoProductId('pro');
 * // Returns: 'prd_xxx' (the Pro plan product ID)
 */
export function getDodoProductId(planId: string): string {
  const productId = DODO_PRODUCT_IDS[planId];

  if (!productId) {
    throw new Error(
      `Invalid plan ID: ${planId}. Valid wallet plans are: ${Object.keys(DODO_PRODUCT_IDS).join(', ')}`
    );
  }

  return productId;
}

/**
 * Reverse lookup: Gets the internal plan ID from a Dodo product ID.
 * Used in webhook processing to determine which plan the user subscribed to.
 *
 * @param dodoProductId - The Dodo product ID
 * @returns The internal plan ID (pro, growth, scale), or null if not found
 *
 * @example
 * const planId = getPlanFromDodoProductId('prd_xxx');
 * // Returns: 'pro'
 */
export function getPlanFromDodoProductId(dodoProductId: string): string | null {
  for (const [planId, productId] of Object.entries(DODO_PRODUCT_IDS)) {
    if (productId === dodoProductId) {
      return planId;
    }
  }
  return null;
}

/**
 * Validates that a plan ID is a valid wallet plan.
 *
 * @param planId - The plan ID to validate
 * @returns True if the plan is valid for wallet credits
 */
export function isValidWalletPlan(planId: string): boolean {
  return planId in DODO_PRODUCT_IDS;
}

// =============================================================================
// WEBHOOK VERIFICATION
// =============================================================================

import { Webhook } from 'standardwebhooks';

/**
 * Verifies a Dodo webhook signature using the standardwebhooks library.
 *
 * CRITICAL: Always verify webhook signatures before processing events.
 * This prevents malicious actors from sending fake webhook events.
 *
 * Dodo uses the Standard Webhooks specification:
 * - Headers: webhook-id, webhook-timestamp, webhook-signature
 * - Signed payload: msg_id.timestamp.payload
 * - Secret format: whsec_<base64_encoded_secret>
 *
 * @param payload - The raw request body as a string
 * @param signature - The signature from the webhook-signature header
 * @param timestamp - The timestamp from the webhook-timestamp header
 * @param webhookId - The webhook ID from the webhook-id header
 * @returns true if the signature is valid, false otherwise
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  webhookId?: string
): Promise<boolean> {
  const secret = process.env.DODO_WEBHOOK_SECRET;

  if (!secret) {
    console.error('[Dodo Webhook] DODO_WEBHOOK_SECRET is not set');
    return false;
  }

  try {
    // Use the standardwebhooks library for verification
    // This is the same library Dodo uses, ensuring compatibility
    const wh = new Webhook(secret);

    // Construct the headers object expected by standardwebhooks
    const headers = {
      'webhook-id': webhookId || '',
      'webhook-timestamp': timestamp,
      'webhook-signature': signature,
    };

    // Verify — throws if invalid
    wh.verify(payload, headers);
    return true;
  } catch (error) {
    console.error('[Dodo Webhook] Signature verification failed:', error);
    return false;
  }
}

/**
 * Validates webhook timestamp to prevent replay attacks.
 * Rejects webhooks older than 5 minutes.
 *
 * @param timestamp - The timestamp string from the webhook header
 * @returns true if the timestamp is within acceptable range
 */
export function isWebhookTimestampValid(timestamp: string): boolean {
  const webhookTime = parseInt(timestamp, 10);

  if (isNaN(webhookTime)) {
    console.error('[Dodo Webhook] Invalid timestamp format');
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const fiveMinutesAgo = now - 300;

  // Reject webhooks older than 5 minutes
  if (webhookTime < fiveMinutesAgo) {
    console.error('[Dodo Webhook] Webhook timestamp too old:', {
      webhookTime,
      now,
      diff: now - webhookTime,
    });
    return false;
  }

  // Reject webhooks from the future (with 60 second tolerance for clock skew)
  if (webhookTime > now + 60) {
    console.error('[Dodo Webhook] Webhook timestamp in the future');
    return false;
  }

  return true;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Custom error class for Dodo-related errors.
 * Provides structured error information for better debugging.
 */
export class DodoError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly originalError?: unknown;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'DodoError';
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DodoError);
    }
  }
}

/**
 * Error codes for common Dodo-related errors.
 */
export const DodoErrorCodes = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  SUBSCRIPTION_NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  WEBHOOK_VERIFICATION_FAILED: 'WEBHOOK_VERIFICATION_FAILED',
  INVALID_PRODUCT: 'INVALID_PRODUCT',
  RATE_LIMITED: 'RATE_LIMITED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Wraps Dodo API calls with consistent error handling.
 * Converts Dodo SDK errors into DodoError instances.
 *
 * @param operation - Async function that performs the Dodo API call
 * @param context - Description of the operation for error messages
 * @returns The result of the operation
 * @throws DodoError with structured error information
 *
 * @example
 * ```typescript
 * const customer = await withDodoErrorHandling(
 *   () => client.customers.create({ email, name }),
 *   'creating customer'
 * );
 * ```
 */
export async function withDodoErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Log error for debugging (sanitize in production)
    console.error(`[Dodo Error] Failed ${context}:`, {
      message: error.message,
      status: error.status,
      code: error.code,
    });

    // Map common error scenarios
    if (error.status === 401) {
      throw new DodoError(
        'Invalid Dodo API key',
        DodoErrorCodes.INVALID_API_KEY,
        401,
        error
      );
    }

    if (error.status === 404) {
      throw new DodoError(
        `Resource not found while ${context}`,
        error.code || DodoErrorCodes.UNKNOWN_ERROR,
        404,
        error
      );
    }

    if (error.status === 429) {
      throw new DodoError(
        'Rate limit exceeded. Please try again later.',
        DodoErrorCodes.RATE_LIMITED,
        429,
        error
      );
    }

    if (error.status >= 500) {
      throw new DodoError(
        'Dodo Payments service is temporarily unavailable',
        DodoErrorCodes.NETWORK_ERROR,
        error.status,
        error
      );
    }

    // Re-throw as DodoError with original details
    throw new DodoError(
      error.message || `Failed ${context}`,
      error.code || DodoErrorCodes.UNKNOWN_ERROR,
      error.status,
      error
    );
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Formats a Dodo amount (in cents) to a display string.
 *
 * @param amountInCents - The amount in cents
 * @param currency - The currency code (default: USD)
 * @returns Formatted string like "$79.00"
 */
export function formatDodoAmount(amountInCents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amountInCents / 100);
}

/**
 * Converts dollars to cents for Dodo API.
 * Dodo expects amounts in the smallest currency unit (cents for USD).
 *
 * @param dollars - The amount in dollars
 * @returns The amount in cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Converts cents to dollars for display.
 *
 * @param cents - The amount in cents
 * @returns The amount in dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

// =============================================================================
// WEBHOOK EVENT TYPES
// =============================================================================

/**
 * Dodo webhook event types that we handle.
 * Keep this in sync with the events configured in the Dodo dashboard.
 *
 * Reference: Check Dodo documentation for the full list of event types.
 */
export const DodoWebhookEvents = {
  // Payment events
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',

  // Subscription events
  SUBSCRIPTION_ACTIVE: 'subscription.active',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  SUBSCRIPTION_EXPIRED: 'subscription.expired',
  SUBSCRIPTION_TRIAL_ENDING: 'subscription.trial_ending',
  SUBSCRIPTION_RENEWED: 'subscription.renewed',

  // Customer events
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
} as const;

export type DodoWebhookEventType = typeof DodoWebhookEvents[keyof typeof DodoWebhookEvents];

/**
 * Type for Dodo webhook payload.
 * Extend this as needed based on actual webhook payloads.
 */
export interface DodoWebhookPayload {
  business_id: string;
  type: string;
  timestamp: string;
  data: {
    payload_type?: string;
    customer?: { customer_id?: string; email?: string; name?: string };
    subscription_id?: string;
    payment_id?: string;
    product_id?: string;
    status?: string;
    metadata?: Record<string, string>;
    [key: string]: unknown;
  };
}

/** Extract customer_id from Dodo webhook data (nested under data.customer) */
export function getCustomerId(data: DodoWebhookPayload['data']): string | undefined {
  return data.customer?.customer_id;
}

// =============================================================================
// SUBSCRIPTION STATUS MAPPING
// =============================================================================

/**
 * Maps Dodo subscription statuses to internal statuses.
 * Keeps our internal status representation consistent.
 */
export function mapDodoSubscriptionStatus(
  dodoStatus: string
): 'trialing' | 'active' | 'cancelled' | 'expired' | 'past_due' {
  const statusMap: Record<string, 'trialing' | 'active' | 'cancelled' | 'expired' | 'past_due'> = {
    'trialing': 'trialing',
    'active': 'active',
    'cancelled': 'cancelled',
    'canceled': 'cancelled', // Handle US/UK spelling
    'expired': 'expired',
    'past_due': 'past_due',
    'unpaid': 'past_due',
  };

  return statusMap[dodoStatus.toLowerCase()] || 'active';
}
