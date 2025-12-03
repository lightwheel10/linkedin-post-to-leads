# Billing & Credits System

---

## Overview

LinkMind uses a credit-based system. Users purchase or earn credits, which are consumed when they perform actions in the app.

---

## Apify Costs (Our Cost)

| Scraper | Apify Cost | Typical Volume |
|---------|------------|----------------|
| Post Scraper | $0.005 per post | 1 per analysis |
| Reactions Scraper | $0.005 per reaction | 100 - 10,000+ |
| **Comments Scraper** | $0.005 per comment | 30 - 500 |
| Profile Scraper | $0.005 per profile | 1 per enrichment |

**The Problem:** Reactions are charged per-reaction. A viral post with 10k reactions = $50 to scrape.

**The Solution:** Comments are 10-50x fewer than reactions but higher quality leads. Prioritize comments.

---

## Credit Costs (User Pays)

| Action | Credits | Our Cost | Notes |
|--------|---------|----------|-------|
| **Post Analysis (Reactions)** | TBD | $0.005 + (N × $0.005) | N = reactions scraped |
| **Post Analysis (Comments)** | TBD | $0.005 + (N × $0.005) | N = comments scraped (cheaper!) |
| **Profile Enrichment** | TBD | $0.005 | Per profile |
| **Save to CRM** | TBD | $0 | Free for us |
| **CSV Export** | TBD | $0 | Free for us |

> ⚠️ **Critical Decision Needed:** 
> 1. How to handle posts with high reaction counts?
> 2. Should we offer Comments-only analysis as cheaper option?
> 3. Should we default to Comments and make Reactions a premium feature?

---

## Free Tier

- **50 credits** on signup
- No credit card required
- Credits never expire

---

## Integration Checklist

### Database

- [ ] Add `credits` column to `users` table (integer, default: 50)
- [ ] Create `credit_transactions` table for history:
  ```sql
  CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    amount INTEGER NOT NULL,  -- positive = add, negative = deduct
    action TEXT NOT NULL,     -- 'signup_bonus', 'post_analysis', 'enrichment', etc.
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

### API Endpoints

- [ ] `GET /api/user/credits` — Get current balance
- [ ] `POST /api/user/credits/deduct` — Deduct credits (internal use)
- [ ] `GET /api/user/credits/history` — Get transaction history

### Actions to Deduct Credits

Connect billing to these files:

| File | Action | Integration Point |
|------|--------|-------------------|
| `app/actions/analyze-post.ts` | Post Analysis | Before calling Apify actors |
| `app/api/crm/enrich/route.ts` | Profile Enrichment | Before scraping profile |
| `app/api/crm/route.ts` | Save to CRM | When saving new lead |
| `app/api/crm/export/route.ts` | CSV Export | Before generating CSV |

### Flow

1. **Check balance** before action
2. **Deduct credits** after successful action (not before, in case it fails)
3. **Log transaction** in `credit_transactions`
4. **Return error** if insufficient credits

### Example Deduction Logic

```typescript
// lib/credits.ts

import { supabase } from './supabase';

export async function deductCredits(
  userId: string, 
  amount: number, 
  action: string,
  description?: string
): Promise<{ success: boolean; balance?: number; error?: string }> {
  // Get current balance
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    return { success: false, error: 'User not found' };
  }

  if (user.credits < amount) {
    return { success: false, error: 'Insufficient credits' };
  }

  // Deduct credits
  const newBalance = user.credits - amount;
  const { error: updateError } = await supabase
    .from('users')
    .update({ credits: newBalance })
    .eq('id', userId);

  if (updateError) {
    return { success: false, error: 'Failed to deduct credits' };
  }

  // Log transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: -amount,
    action,
    description
  });

  return { success: true, balance: newBalance };
}

export async function addCredits(
  userId: string,
  amount: number,
  action: string,
  description?: string
): Promise<{ success: boolean; balance?: number; error?: string }> {
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    return { success: false, error: 'User not found' };
  }

  const newBalance = user.credits + amount;
  const { error: updateError } = await supabase
    .from('users')
    .update({ credits: newBalance })
    .eq('id', userId);

  if (updateError) {
    return { success: false, error: 'Failed to add credits' };
  }

  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: amount,
    action,
    description
  });

  return { success: true, balance: newBalance };
}
```

---

## Payments (Future)

For purchasing credits:

- **Stripe** — Recommended for credit card payments
- **LemonSqueezy** — Alternative with simpler tax handling

Webhook flow:
1. User clicks "Buy Credits"
2. Redirect to Stripe Checkout
3. Stripe sends `checkout.session.completed` webhook
4. Webhook handler calls `addCredits()`

---

## UI Locations

Credits should be displayed in:

- [ ] Settings > Billing (current balance, buy button)
- [ ] Dashboard header (quick balance view)
- [ ] Before expensive actions (confirmation modal with cost)

---

## Pricing Strategy (TBD)

Options to consider:

### Option A: Simple Credit Packs
- 100 credits = $10
- 500 credits = $40 (20% discount)
- 1000 credits = $70 (30% discount)

### Option B: Monthly Subscription + Credits
- Free: 50 credits/month
- Pro ($29/mo): 500 credits/month
- Business ($79/mo): 2000 credits/month

### Option C: Pay-as-you-go
- No subscription
- Credits purchased in any amount
- $0.10 per credit

---

## Notes

- Always deduct credits **after** the action succeeds, not before
- Consider caching credit balance on frontend to reduce API calls
- Add rate limiting to prevent abuse even with credits

