// =============================================================================
// CREDIT PACKS CONFIGURATION (Shared between server and client)
// =============================================================================
//
// This file is intentionally kept separate from lib/wallet.ts because wallet.ts
// imports server-only Supabase modules. Client components (like the settings
// page and analyze page) need access to pack configuration for display,
// so this file must be safe to import from client components.
//
// DO NOT import server-only modules here (supabase/server, etc.).
// =============================================================================

export type CreditPackId = 'credit_10' | 'credit_25' | 'credit_50';

export interface CreditPack {
  id: CreditPackId;
  /** Display name shown in UI */
  name: string;
  /** Price user pays in cents */
  priceInCents: number;
  /** Total credits received in cents (includes bonus if any) */
  creditsInCents: number;
  /** Bonus credits in cents (0 if no bonus) */
  bonusInCents: number;
}

export const CREDIT_PACKS: Record<CreditPackId, CreditPack> = {
  credit_10: {
    id: 'credit_10',
    name: 'Starter',
    priceInCents: 1000,      // $10.00
    creditsInCents: 1000,    // $10.00
    bonusInCents: 0,
  },
  credit_25: {
    id: 'credit_25',
    name: 'Popular',
    priceInCents: 2500,      // $25.00
    creditsInCents: 2500,    // $25.00
    bonusInCents: 0,
  },
  credit_50: {
    id: 'credit_50',
    name: 'Power',
    priceInCents: 5000,      // $50.00
    creditsInCents: 5500,    // $55.00 ($5 bonus)
    bonusInCents: 500,       // $5.00
  },
};

/**
 * Validates a credit pack ID.
 * Used to guard against invalid pack IDs in API routes and webhooks.
 */
export function isValidCreditPack(packId: string): packId is CreditPackId {
  return packId in CREDIT_PACKS;
}
