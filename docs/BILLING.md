# Billing & Pricing

---

## Overview

LinkMind uses a **wallet-based subscription model** powered by **Dodo Payments**. Each plan includes monthly wallet credits that users spend on post analyses, profile enrichments, and AI searches. All plans include a **7-day free trial** with credit card required.

---

## Pricing Plans

### Plan Tiers

| Plan | Monthly | Annual | Annual (per mo) | Wallet Credits | You Save (Annual) |
|------|---------|--------|-----------------|----------------|-------------------|
| **Pro** | $79/mo | $790/yr | $65.83/mo | $150/month | $158/year |
| **Growth** | $179/mo | $1,790/yr | $149.17/mo | $300/month | $358/year |
| **Scale** | $279/mo | $2,790/yr | $232.50/mo | $500/month | $558/year |

### Plan Features

| Feature | Pro | Growth | Scale |
|---------|-----|--------|-------|
| Wallet Credits | $150/mo | $300/mo | $500/mo |
| Reactions per Post | Up to 300 | Up to 600 | Up to 1,000 |
| Comments per Post | Up to 200 | Up to 400 | Up to 600 |
| Lead Scoring & Enrichment | Yes | Yes | Yes |
| CRM Integrations | No | Yes | Yes |
| API Access & Webhooks | No | No | Yes |
| Support | Email | Priority | Dedicated Account Manager |

---

## Wallet Credit System

### How Credits Work

Each plan provides a monthly wallet balance in cents (100 cents = $1.00):

| Plan | Wallet Balance | Credits in $ |
|------|----------------|--------------|
| **Pro** | 15,000 cents | $150.00 |
| **Growth** | 30,000 cents | $300.00 |
| **Scale** | 50,000 cents | $500.00 |

### Credit Costs

| Action | Cost |
|--------|------|
| Post reaction scraped | 1 credit ($0.01) |
| Post comment scraped | 1 credit ($0.01) |
| Profile enrichment | 5 credits ($0.05) |
| AI search | 10 credits ($0.10) |

### Wallet Rules

- **Credits reset each billing cycle** (no rollover)
- Usage tracked in `wallet_balance` field on users table
- When credits reach 0, actions are blocked until next billing cycle
- Users can view current balance in dashboard

---

## 7-Day Free Trial

- **Credit card required** (collected via Dodo hosted checkout)
- **Full plan access** during trial period
- **No charge for 7 days** from signup
- Trial dates stored in `trial_ends_at` field
- Users can cancel anytime before trial ends
- First charge occurs on day 8 if not cancelled

### Trial Flow

1. User completes onboarding Steps 1-2 (profile + ICP)
2. User selects plan at Step 3
3. Redirected to Dodo's secure hosted checkout
4. Card details entered on Dodo (PCI compliant)
5. Webhook confirms payment setup
6. 7-day trial begins immediately
7. Subscription status set to `trialing`

---

## Payment Integration (Dodo Payments)

### Environment Variables

```env
DODO_API_KEY=your_api_key
DODO_WEBHOOK_SECRET=your_webhook_secret
DODO_PRODUCT_PRO_MONTHLY=product_id
DODO_PRODUCT_PRO_ANNUAL=product_id
DODO_PRODUCT_GROWTH_MONTHLY=product_id
DODO_PRODUCT_GROWTH_ANNUAL=product_id
DODO_PRODUCT_SCALE_MONTHLY=product_id
DODO_PRODUCT_SCALE_ANNUAL=product_id
```

### Checkout Flow

1. User clicks "Start Free Trial" on onboarding
2. `POST /api/onboarding/checkout` creates Dodo checkout session
3. Callback token generated and stored in `checkout_sessions` table
4. User redirected to Dodo's hosted checkout page
5. After payment, Dodo redirects to `/checkout/callback?token={token}`
6. Callback page polls `/api/checkout/status` for webhook confirmation
7. Webhook marks session as `completed`
8. `POST /api/onboarding/complete` activates subscription

### Webhook Events

| Event | Action |
|-------|--------|
| `payment.succeeded` | Mark checkout session complete, trigger wallet reset |
| `subscription.created` | Initialize wallet with plan credits |
| `subscription.renewed` | Reset wallet credits for new billing cycle |
| `subscription.expired` | Clear wallet, downgrade to free |
| `subscription.cancelled` | Keep wallet until period ends, then downgrade |

### Security Features

- **HMAC-SHA256 signature verification** on all webhooks
- **Timestamp validation** (5-minute window) prevents replay attacks
- **Idempotent processing** via `webhook_events` table
- **Callback token lookup** (not URL params) for payment verification
- Card details **never touch our server** (Dodo handles PCI compliance)

---

## Database Schema

### Users Table (Billing Fields)

```sql
-- Subscription info
plan TEXT DEFAULT 'free',              -- 'free', 'pro', 'growth', 'scale'
selected_plan TEXT,                     -- Plan selected during onboarding
billing_period TEXT,                    -- 'monthly' or 'annual'
plan_started_at TIMESTAMP,
plan_expires_at TIMESTAMP,
trial_ends_at TIMESTAMP,

-- Wallet system
wallet_balance INTEGER DEFAULT 0,       -- Credits in cents
wallet_reset_at TIMESTAMP,

-- Dodo integration
dodo_customer_id TEXT,

-- Payment info (masked only)
card_last_four TEXT,
card_brand TEXT,
card_expiry TEXT,

-- Legacy usage tracking
analyses_used INTEGER DEFAULT 0,
enrichments_used INTEGER DEFAULT 0,
usage_reset_at TIMESTAMP
```

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  plan TEXT NOT NULL,                   -- 'pro', 'growth', 'scale'
  period TEXT NOT NULL,                 -- 'monthly', 'annual'
  status TEXT NOT NULL,                 -- 'trialing', 'active', 'cancelled', 'expired', 'past_due'
  dodo_subscription_id TEXT,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Checkout Sessions Table

```sql
CREATE TABLE checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,             -- Dodo's checkout session ID
  callback_token TEXT UNIQUE NOT NULL,  -- Our secure lookup token
  user_id UUID REFERENCES users(id),
  user_email TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  status TEXT DEFAULT 'pending',        -- 'pending', 'completed', 'failed', 'expired'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP                  -- 24 hours from creation
);
```

### Webhook Events Table

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,        -- Dodo's event ID (for idempotency)
  event_type TEXT NOT NULL,
  payload JSONB,
  processed_at TIMESTAMP DEFAULT NOW(),
  processing_result JSONB
);
```

### Wallet Transactions Table

```sql
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,                 -- 'credit', 'debit', 'reset'
  amount INTEGER NOT NULL,              -- In cents
  reason TEXT,
  balance_after INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Plan Configuration

```typescript
// lib/plans.ts

export const PLANS = {
  free: {
    name: 'Free',
    walletCredits: 0,
    reactionCap: 0,
    commentCap: 0,
  },
  pro: {
    name: 'Pro',
    priceMonthly: 79,
    priceAnnual: 790,
    walletCredits: 15000,  // $150 in cents
    reactionCap: 300,
    commentCap: 200,
  },
  growth: {
    name: 'Growth',
    priceMonthly: 179,
    priceAnnual: 1790,
    walletCredits: 30000,  // $300 in cents
    reactionCap: 600,
    commentCap: 400,
  },
  scale: {
    name: 'Scale',
    priceMonthly: 279,
    priceAnnual: 2790,
    walletCredits: 50000,  // $500 in cents
    reactionCap: 1000,
    commentCap: 600,
  },
} as const;

export type PlanId = keyof typeof PLANS;
```

---

## Wallet Operations

### Credit Costs

```typescript
// lib/wallet.ts

export const CREDIT_COSTS = {
  reaction: 1,       // 1 cent per reaction scraped
  comment: 1,        // 1 cent per comment scraped
  enrichment: 5,     // 5 cents per profile enrichment
  ai_search: 10,     // 10 cents per AI search
} as const;
```

### Check Balance

```typescript
export async function hasEnoughCredits(
  userId: string,
  requiredCredits: number
): Promise<{ allowed: boolean; balance: number; reason?: string }> {
  const user = await getUser(userId);

  if (user.wallet_balance < requiredCredits) {
    return {
      allowed: false,
      balance: user.wallet_balance,
      reason: `Insufficient credits. You have ${user.wallet_balance} cents, need ${requiredCredits}.`
    };
  }

  return { allowed: true, balance: user.wallet_balance };
}
```

### Deduct Credits

```typescript
export async function deductCredits(
  userId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; newBalance: number }> {
  const { data: user } = await supabase
    .from('users')
    .update({ wallet_balance: supabase.raw(`wallet_balance - ${amount}`) })
    .eq('id', userId)
    .select('wallet_balance')
    .single();

  // Log transaction
  await supabase.from('wallet_transactions').insert({
    user_id: userId,
    action: 'debit',
    amount: amount,
    reason: reason,
    balance_after: user.wallet_balance
  });

  return { success: true, newBalance: user.wallet_balance };
}
```

### Reset Wallet (on billing cycle)

```typescript
export async function resetWallet(userId: string, planId: PlanId) {
  const plan = PLANS[planId];

  await supabase
    .from('users')
    .update({
      wallet_balance: plan.walletCredits,
      wallet_reset_at: new Date().toISOString()
    })
    .eq('id', userId);

  // Log reset transaction
  await supabase.from('wallet_transactions').insert({
    user_id: userId,
    action: 'reset',
    amount: plan.walletCredits,
    reason: `Monthly wallet reset for ${plan.name} plan`,
    balance_after: plan.walletCredits
  });
}
```

---

## Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/onboarding/checkout` | POST | Create Dodo checkout session |
| `/api/onboarding/complete` | POST | Activate plan after payment |
| `/api/checkout/status` | GET | Poll for webhook confirmation |
| `/api/webhooks/dodo` | POST | Handle Dodo webhook events |
| `/api/billing/wallet` | GET | Get current wallet balance |
| `/api/billing/subscription` | GET | Get subscription details |
| `/api/billing/cancel` | POST | Cancel subscription |

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/dodo.ts` | Dodo Payments client configuration |
| `lib/wallet.ts` | Wallet credit operations |
| `lib/data-store.ts` | Subscription & user database operations |
| `app/api/onboarding/checkout/route.ts` | Create checkout session |
| `app/api/onboarding/complete/route.ts` | Complete onboarding & activate plan |
| `app/api/checkout/status/route.ts` | Payment status polling |
| `app/api/webhooks/dodo/route.ts` | Webhook handler |
| `app/checkout/callback/page.tsx` | Post-payment callback UI |

---

## Subscription Lifecycle

```
1. USER SIGNS UP
   └─> onboarding_completed = false
   └─> plan = 'free'

2. COMPLETES ONBOARDING
   └─> Selects plan (pro/growth/scale)
   └─> Redirected to Dodo checkout
   └─> Card details entered on Dodo

3. PAYMENT CONFIRMED (via webhook)
   └─> checkout_sessions.status = 'completed'
   └─> subscription created with status = 'trialing'
   └─> trial_ends_at = now + 7 days
   └─> wallet_balance = plan credits
   └─> onboarding_completed = true

4. TRIAL PERIOD (7 days)
   └─> Full access to plan features
   └─> Wallet credits available
   └─> Can cancel anytime (no charge)

5. TRIAL ENDS
   └─> First payment charged
   └─> subscription.status = 'active'
   └─> Billing cycle begins

6. MONTHLY RENEWAL
   └─> Webhook: subscription.renewed
   └─> Wallet reset to plan credits
   └─> current_period_start/end updated

7. CANCELLATION
   └─> Keep access until period ends
   └─> subscription.status = 'cancelled'
   └─> At period end: downgrade to 'free'
```

---

## Notes

- **Wallet credits reset each billing cycle** - no rollover
- **Annual plans get 2 months free** (10 months price for 12 months)
- **All payments processed by Dodo** - PCI compliant, card details never on our server
- **Webhook is single source of truth** - URL parameters never trusted for payment status
- **24-hour checkout session expiry** for security
- **Idempotent webhook processing** prevents duplicate credit/debit operations
