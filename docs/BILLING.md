# Billing & Pricing

---

## Overview

LinkMind uses a subscription-based pricing model with hard caps on usage. Each plan includes a fixed number of post analyses and profile enrichments per month.

---

## Pricing Plans

### Monthly Pricing

| Plan | Price | Post Analyses | Enrichments | Reaction Cap | Comment Cap |
|------|-------|---------------|-------------|--------------|-------------|
| **Starter** | $79/mo | 15 | 50 | 200 | 150 |
| **Pro** | $149/mo | 25 | 120 | 300 | 200 |
| **Business** | $299/mo | 45 | 300 | 400 | 300 |

### Annual Pricing (2 Months Free)

| Plan | Monthly | Annual | Effective Monthly | You Save |
|------|---------|--------|-------------------|----------|
| **Starter** | $79/mo | $790/yr | $65.83/mo | $158 |
| **Pro** | $149/mo | $1,490/yr | $124.17/mo | $298 |
| **Business** | $299/mo | $2,990/yr | $249.17/mo | $598 |

---

## What's Included

### Post Analysis
When a user enters a LinkedIn post URL:
1. Scrape post metadata (author, content, stats)
2. Scrape reactions (up to plan cap)
3. Scrape comments (up to plan cap)
4. Run ICP filter on all scraped profiles
5. Display qualified leads

**1 analysis = 1 post URL processed**

### Profile Enrichment
When a user clicks "Enrich" on a lead:
1. Scrape full LinkedIn profile
2. Get: experience, education, skills, about, location
3. Save to CRM

**1 enrichment = 1 full profile scraped**

### Free Features
- CSV/JSON export (unlimited)
- Save to CRM (unlimited)
- ICP filtering (unlimited)

---

## Hard Caps

Each plan has hard limits to ensure predictable costs:

| Plan | Max Reactions/Post | Max Comments/Post | Total People/Post |
|------|-------------------|-------------------|-------------------|
| **Starter** | 200 | 150 | 350 |
| **Pro** | 300 | 200 | 500 |
| **Business** | 400 | 300 | 700 |

**What users see:**
> "Each analysis scans up to [X] people from a post and identifies leads matching your ICP."

---

## Cost Structure (Internal)

### Apify Costs

| Scraper | Cost |
|---------|------|
| Post metadata | $0.005 per post |
| Reactions | $0.005 per reaction |
| Comments | $0.005 per comment |
| Profile enrichment | $0.005 per profile |

### Cost Per Analysis

| Plan | Post | Reactions | Comments | Total/Analysis |
|------|------|-----------|----------|----------------|
| **Starter** | $0.005 | $1.00 | $0.75 | **$1.755** |
| **Pro** | $0.005 | $1.50 | $1.00 | **$2.505** |
| **Business** | $0.005 | $2.00 | $1.50 | **$3.505** |

### Monthly Cost & Margins

| Plan | Revenue | Analysis Cost | Enrichment Cost | Total Cost | Margin |
|------|---------|---------------|-----------------|------------|--------|
| **Starter** | $79 | $26.33 | $0.25 | **$26.58** | **66%** |
| **Pro** | $149 | $62.63 | $0.60 | **$63.23** | **58%** |
| **Business** | $299 | $157.73 | $1.50 | **$159.23** | **47%** |

### Annual Margins

| Plan | Revenue | Total Cost | Margin |
|------|---------|------------|--------|
| **Starter** | $790 | $318.96 | **60%** |
| **Pro** | $1,490 | $758.76 | **49%** |
| **Business** | $2,990 | $1,910.76 | **36%** |

---

## Free Trial

- **2 free analyses** (no credit card required)
- **5 free enrichments**
- Hard caps: 200 reactions + 150 comments
- Purpose: Let users experience value before paying

---

## Database Schema

### Users Table (Update)

```sql
ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN plan_period TEXT; -- 'monthly' or 'annual'
ALTER TABLE users ADD COLUMN plan_started_at TIMESTAMP;
ALTER TABLE users ADD COLUMN plan_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN analyses_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN enrichments_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN analyses_reset_at TIMESTAMP;
```

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  plan TEXT NOT NULL, -- 'starter', 'pro', 'business'
  period TEXT NOT NULL, -- 'monthly', 'annual'
  status TEXT NOT NULL, -- 'active', 'cancelled', 'expired'
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Usage Tracking Table

```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- 'analysis', 'enrichment'
  post_url TEXT,
  reactions_scraped INTEGER,
  comments_scraped INTEGER,
  leads_found INTEGER,
  cost DECIMAL(10,4),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Plan Limits

```typescript
// lib/plans.ts

export const PLANS = {
  free: {
    name: 'Free Trial',
    analyses: 2,
    enrichments: 5,
    reactionCap: 200,
    commentCap: 150,
  },
  starter: {
    name: 'Starter',
    priceMonthly: 79,
    priceAnnual: 790,
    analyses: 15,
    enrichments: 50,
    reactionCap: 200,
    commentCap: 150,
  },
  pro: {
    name: 'Pro',
    priceMonthly: 149,
    priceAnnual: 1490,
    analyses: 25,
    enrichments: 120,
    reactionCap: 300,
    commentCap: 200,
  },
  business: {
    name: 'Business',
    priceMonthly: 299,
    priceAnnual: 2990,
    analyses: 45,
    enrichments: 300,
    reactionCap: 400,
    commentCap: 300,
  },
} as const;

export type PlanId = keyof typeof PLANS;
```

---

## Usage Check Flow

```typescript
// lib/usage.ts

import { PLANS, PlanId } from './plans';

export async function canAnalyze(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const user = await getUser(userId);
  const plan = PLANS[user.plan as PlanId];
  
  if (user.analyses_used >= plan.analyses) {
    return { 
      allowed: false, 
      reason: `You've used all ${plan.analyses} analyses this month. Upgrade for more.` 
    };
  }
  
  return { allowed: true };
}

export async function canEnrich(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const user = await getUser(userId);
  const plan = PLANS[user.plan as PlanId];
  
  if (user.enrichments_used >= plan.enrichments) {
    return { 
      allowed: false, 
      reason: `You've used all ${plan.enrichments} enrichments this month. Upgrade for more.` 
    };
  }
  
  return { allowed: true };
}

export async function incrementUsage(userId: string, type: 'analysis' | 'enrichment') {
  if (type === 'analysis') {
    await supabase
      .from('users')
      .update({ analyses_used: supabase.raw('analyses_used + 1') })
      .eq('id', userId);
  } else {
    await supabase
      .from('users')
      .update({ enrichments_used: supabase.raw('enrichments_used + 1') })
      .eq('id', userId);
  }
}
```

---

## Monthly Reset

Reset usage counters on billing cycle:

```typescript
// Cron job or Stripe webhook on invoice.paid

export async function resetMonthlyUsage(userId: string) {
  await supabase
    .from('users')
    .update({ 
      analyses_used: 0, 
      enrichments_used: 0,
      analyses_reset_at: new Date().toISOString()
    })
    .eq('id', userId);
}
```

---

## Stripe Integration

### Products to Create in Stripe

| Product | Price ID (Monthly) | Price ID (Annual) |
|---------|-------------------|-------------------|
| Starter | `price_starter_monthly` | `price_starter_annual` |
| Pro | `price_pro_monthly` | `price_pro_annual` |
| Business | `price_business_monthly` | `price_business_annual` |

### Webhook Events to Handle

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create subscription, update user plan |
| `invoice.paid` | Reset monthly usage |
| `customer.subscription.updated` | Update plan if changed |
| `customer.subscription.deleted` | Downgrade to free |

---

## UI Integration Points

- [ ] Settings > Billing — Current plan, usage, upgrade buttons
- [ ] Dashboard header — Usage indicator (5/15 analyses used)
- [ ] Before analysis — Check limit, show upgrade if exceeded
- [ ] Before enrichment — Check limit, show upgrade if exceeded
- [ ] Pricing page — Plan comparison with annual toggle

---

## Notes

- Usage resets on billing cycle, not calendar month
- Cache usage counts on frontend to reduce API calls
- Show upgrade prompts at 80% usage
- Annual plans get same monthly limits (not 12x)
