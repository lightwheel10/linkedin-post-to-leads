// =============================================================================
// WALLET BALANCE API
// =============================================================================
//
// Returns the current wallet balance and transaction history for the user.
//
// WALLET SYSTEM OVERVIEW:
// =======================
// - Users subscribe to plans that give wallet credits each billing cycle
// - Credits are stored in CENTS (100 cents = $1.00)
// - Credits are spent on actions (analysis, enrichment, search)
// - Unused credits are FORFEITED at end of billing cycle (no rollover)
//
// ENDPOINTS:
// ==========
// GET /api/billing/wallet - Get current balance and status
// GET /api/billing/wallet?history=true - Include transaction history
//
// Created: 2nd January 2026
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getOrCreateUser } from '@/lib/data-store';
import {
  getWalletStatus,
  getWalletTransactions,
  WALLET_PLANS,
  formatCredits,
  WalletPlanId,
} from '@/lib/wallet';

// =============================================================================
// GET /api/billing/wallet
// =============================================================================

/**
 * Gets the current wallet balance and status for the authenticated user.
 *
 * Query parameters:
 * - history: If 'true', includes recent transaction history
 * - limit: Number of transactions to return (default: 20, max: 100)
 *
 * Response:
 * {
 *   "balance": {
 *     "current": 12500,           // Balance in cents
 *     "formatted": "$125.00",     // Human-readable balance
 *     "plan": "pro",              // Current plan
 *     "planName": "Pro"           // Plan display name
 *   },
 *   "allocation": {               // What they get per billing cycle
 *     "total": 15000,
 *     "totalFormatted": "$150.00",
 *     "base": 10000,
 *     "bonus": 5000
 *   },
 *   "usage": {
 *     "spent": 2500,              // Credits used this period
 *     "spentFormatted": "$25.00",
 *     "percentUsed": 17           // Percentage of allocation used
 *   },
 *   "period": {
 *     "lastReset": "2026-01-01T00:00:00Z",
 *     "nextReset": "2026-02-01T00:00:00Z",
 *     "daysRemaining": 15
 *   },
 *   "transactions": [...]         // Only if history=true
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // =========================================================================
    // STEP 1: Authenticate user
    // =========================================================================
    const userEmail = await getAuthenticatedUser();

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to continue.' },
        { status: 401 }
      );
    }

    // =========================================================================
    // STEP 2: Get user record
    // =========================================================================
    const user = await getOrCreateUser(userEmail);

    // =========================================================================
    // STEP 3: Get wallet status
    // =========================================================================
    const walletStatus = await getWalletStatus(user.id);

    if (!walletStatus) {
      return NextResponse.json(
        { error: 'Failed to retrieve wallet status' },
        { status: 500 }
      );
    }

    // =========================================================================
    // STEP 4: Calculate usage statistics
    // =========================================================================
    const planConfig = walletStatus.plan !== 'free'
      ? WALLET_PLANS[walletStatus.plan as WalletPlanId]
      : null;

    // Calculate how much has been spent this period
    // (allocation - current balance)
    const totalAllocation = planConfig?.totalCredits || 0;
    const spent = Math.max(0, totalAllocation - walletStatus.balanceInCents);
    const percentUsed = totalAllocation > 0
      ? Math.round((spent / totalAllocation) * 100)
      : 0;

    // Calculate days remaining in billing period
    let daysRemaining = 0;
    if (walletStatus.nextResetAt) {
      const now = new Date();
      const nextReset = new Date(walletStatus.nextResetAt);
      daysRemaining = Math.max(0, Math.ceil(
        (nextReset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ));
    }

    // =========================================================================
    // STEP 5: Build response
    // =========================================================================
    const response: Record<string, unknown> = {
      balance: {
        current: walletStatus.balanceInCents,
        formatted: walletStatus.balanceFormatted,
        plan: walletStatus.plan,
        planName: planConfig?.name || 'Free',
      },
      allocation: planConfig
        ? {
            total: planConfig.totalCredits,
            totalFormatted: formatCredits(planConfig.totalCredits),
            base: planConfig.baseCredits,
            baseFormatted: formatCredits(planConfig.baseCredits),
            bonus: planConfig.bonusCredits,
            bonusFormatted: formatCredits(planConfig.bonusCredits),
          }
        : null,
      usage: {
        spent,
        spentFormatted: formatCredits(spent),
        percentUsed,
        remaining: walletStatus.balanceInCents,
        remainingFormatted: walletStatus.balanceFormatted,
      },
      period: {
        lastReset: walletStatus.lastResetAt,
        nextReset: walletStatus.nextResetAt,
        daysRemaining,
      },
      limits: planConfig
        ? {
            reactionsPerPost: planConfig.reactionsPerPost,
            commentsPerPost: planConfig.commentsPerPost,
          }
        : null,
    };

    // =========================================================================
    // STEP 6: Include transaction history if requested
    // =========================================================================
    const includeHistory = request.nextUrl.searchParams.get('history') === 'true';

    if (includeHistory) {
      const limitParam = request.nextUrl.searchParams.get('limit');
      const limit = Math.min(100, Math.max(1, parseInt(limitParam || '20', 10)));

      const transactions = await getWalletTransactions(user.id, limit);

      response.transactions = transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        amountFormatted: formatCredits(Math.abs(tx.amount)),
        balanceAfter: tx.balanceAfter,
        balanceAfterFormatted: formatCredits(tx.balanceAfter),
        reason: tx.reason,
        actionType: tx.actionType,
        createdAt: tx.createdAt,
      }));
    }

    // =========================================================================
    // STEP 7: Return response
    // =========================================================================
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Wallet API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve wallet information' },
      { status: 500 }
    );
  }
}
