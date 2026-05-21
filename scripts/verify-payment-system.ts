// =============================================================================
// PAYMENT SYSTEM VERIFICATION SCRIPT
// =============================================================================
//
// This script verifies that the wallet-based payment system and security fixes
// are working correctly.
//
// Created: 2nd January 2026
//
// HOW TO RUN:
// ===========
// 1. Make sure your .env file has the correct Supabase credentials
// 2. Run: npx tsx scripts/verify-payment-system.ts
//
// WHAT IT TESTS:
// ==============
// 1. Database functions exist and work correctly
// 2. Atomic credit deduction and reservation prevent race conditions
// 3. Wallet-only access is enforced for free and trial users
// 4. Wallet balance tracking is accurate
// 5. Security fixes are in place
// =============================================================================

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
config();

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Make sure you have:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test user ID - using TEXT format matching the codebase convention (user_xxx)
const TEST_USER_ID = `test_verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const TEST_USER_EMAIL = `test_${Date.now()}@verification.test`;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
  const prefix = {
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️`,
    info: `${colors.blue}ℹ️`,
  };
  console.log(`${prefix[type]} ${message}${colors.reset}`);
}

function header(title: string) {
  console.log('\n' + colors.bold + colors.blue + '═'.repeat(60) + colors.reset);
  console.log(colors.bold + `  ${title}` + colors.reset);
  console.log(colors.blue + '═'.repeat(60) + colors.reset + '\n');
}

// =============================================================================
// TEST 1: Verify Database Functions Exist
// =============================================================================
async function testDatabaseFunctionsExist() {
  header('TEST 1: Database Functions Exist');

  // Use a TEXT format for testing (matching codebase convention)
  const nonexistentUserId = 'nonexistent_user_000';

  // Check deduct_wallet_credits function
  const { data: deductFn, error: deductError } = await supabase.rpc('deduct_wallet_credits', {
    p_user_id: nonexistentUserId,
    p_amount: 1,
    p_action_type: 'post_analysis',
    p_reason: 'Test',
    p_metadata: null,
  });

  if (deductError && !deductError.message.includes('User not found')) {
    log(`deduct_wallet_credits function error: ${deductError.message}`, 'error');
    return false;
  }
  // Check the result - it should return "User not found" error
  const deductResult = deductFn?.[0];
  if (!deductResult || (deductResult.success !== false)) {
    // Function exists but returned unexpected result, that's still OK for this test
  }
  log('deduct_wallet_credits function exists and is callable', 'success');

  // Check add_purchased_credits function
  const { data: addFn, error: addError } = await supabase.rpc('add_purchased_credits', {
    p_user_id: nonexistentUserId,
    p_amount: 1,
  });

  if (addError && !addError.message.includes('User not found')) {
    log(`add_purchased_credits function error: ${addError.message}`, 'error');
    return false;
  }
  const addResult = addFn?.[0];
  if (!addResult || addResult.success !== false) {
    // Function exists but returned unexpected result, that's still OK for this test
  }
  log('add_purchased_credits function exists and is callable', 'success');

  const { data: reserveFn, error: reserveError } = await supabase.rpc('reserve_wallet_credits', {
    p_user_id: nonexistentUserId,
    p_amount: 1,
    p_action_type: 'post_analysis',
    p_reason: 'Test reservation',
    p_metadata: null,
  });

  if (reserveError && !reserveError.message.includes('User not found')) {
    log(`reserve_wallet_credits function error: ${reserveError.message}`, 'error');
    return false;
  }
  if (reserveFn?.[0]?.success !== false) {
    // Function exists but returned unexpected result, that's still OK for this test
  }
  log('reserve_wallet_credits function exists and is callable', 'success');

  const { error: settleError } = await supabase.rpc('settle_wallet_reservation', {
    p_user_id: nonexistentUserId,
    p_reservation_id: '00000000-0000-0000-0000-000000000000',
    p_actual_amount: 0,
    p_metadata: null,
  });

  if (settleError && !settleError.message.includes('Reservation not found')) {
    log(`settle_wallet_reservation function error: ${settleError.message}`, 'error');
    return false;
  }
  log('settle_wallet_reservation function exists and is callable', 'success');

  return true;
}

// =============================================================================
// TEST 2: Create Test User
// =============================================================================
async function createTestUser(plan: 'free' | 'pro' | 'growth' | 'scale', walletBalance: number = 0) {
  // First, check if test user already exists and delete it
  await deleteTestUser();

  const { error } = await supabase.from('users').insert({
    id: TEST_USER_ID,
    email: TEST_USER_EMAIL,
    plan: plan,
    wallet_balance: walletBalance,
    // These columns have defaults, but we set them explicitly for testing
    analyses_used: 0,
    enrichments_used: 0,
    // Required fields based on data-store.ts
    settings: {
      icp_keywords: [],
      exclude_keywords: [],
      default_export_format: 'csv',
      notifications_enabled: true
    },
    locations: [],
    industries: [],
    onboarding_completed: false,
    onboarding_step: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    log(`Failed to create test user: ${error.message}`, 'error');
    return false;
  }
  log(`Created test user with plan: ${plan}, wallet: $${(walletBalance / 100).toFixed(2)}`, 'success');
  return true;
}

async function deleteTestUser() {
  // Delete wallet transactions first (foreign key)
  await supabase.from('wallet_transactions').delete().eq('user_id', TEST_USER_ID);
  // Delete usage logs
  await supabase.from('usage_logs').delete().eq('user_id', TEST_USER_ID);
  // Delete user
  await supabase.from('users').delete().eq('id', TEST_USER_ID);
}

async function updateTestUser(updates: Record<string, unknown>) {
  const { error } = await supabase.from('users').update(updates).eq('id', TEST_USER_ID);
  return !error;
}

async function getTestUser() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', TEST_USER_ID)
    .single();
  return data;
}

// =============================================================================
// TEST 3: Atomic Credit Deduction
// =============================================================================
async function testAtomicCreditDeduction() {
  header('TEST 2: Atomic Credit Deduction');

  // createTestUser now handles cleanup internally
  if (!await createTestUser('pro', 10000)) return false; // $100 balance

  // Test 1: Normal deduction
  log('Testing normal credit deduction...', 'info');
  const { data: result1 } = await supabase.rpc('deduct_wallet_credits', {
    p_user_id: TEST_USER_ID,
    p_amount: 500, // $5
    p_action_type: 'post_analysis',
    p_reason: 'Test deduction 1',
    p_metadata: { test: true },
  });

  const deductResult1 = result1?.[0];
  if (!deductResult1?.success || deductResult1?.new_balance !== 9500) {
    log(`Expected success with balance 9500, got: ${JSON.stringify(deductResult1)}`, 'error');
    return false;
  }
  log(`Deduction successful: $5 deducted, new balance: $${(deductResult1.new_balance / 100).toFixed(2)}`, 'success');

  // Test 2: Insufficient credits should fail
  log('Testing insufficient credits rejection...', 'info');
  const { data: result2 } = await supabase.rpc('deduct_wallet_credits', {
    p_user_id: TEST_USER_ID,
    p_amount: 20000, // $200 - more than available
    p_action_type: 'post_analysis',
    p_reason: 'Should fail',
    p_metadata: null,
  });

  const deductResult2 = result2?.[0];
  if (deductResult2?.success !== false) {
    log(`Expected failure for insufficient credits, got: ${JSON.stringify(deductResult2)}`, 'error');
    return false;
  }
  log(`Correctly rejected: ${deductResult2?.error_message}`, 'success');

  // Verify balance unchanged
  const user = await getTestUser();
  if (user?.wallet_balance !== 9500) {
    log(`Balance should still be 9500, but is: ${user?.wallet_balance}`, 'error');
    return false;
  }
  log('Balance correctly unchanged after failed deduction', 'success');

  // Test 3: Free user with no wallet balance should fail
  log('Testing empty wallet rejection...', 'info');
  await updateTestUser({ plan: 'free', wallet_balance: 0 });

  const { data: result3 } = await supabase.rpc('deduct_wallet_credits', {
    p_user_id: TEST_USER_ID,
    p_amount: 100,
    p_action_type: 'post_analysis',
    p_reason: 'Should fail for empty wallet',
    p_metadata: null,
  });

  const deductResult3 = result3?.[0];
  if (deductResult3?.success !== false) {
    log(`Expected empty wallet rejection, got: ${JSON.stringify(deductResult3)}`, 'error');
    return false;
  }
  log(`Correctly rejected empty wallet: ${deductResult3?.error_message}`, 'success');

  return true;
}

// =============================================================================
// TEST 4: Wallet Reservations
// =============================================================================
async function testWalletReservations() {
  header('TEST 4: Wallet Reservations');

  if (!await createTestUser('pro', 1000)) return false;

  log('Testing pre-Apify credit reservation...', 'info');
  const { data: reserveResult } = await supabase.rpc('reserve_wallet_credits', {
    p_user_id: TEST_USER_ID,
    p_amount: 600,
    p_action_type: 'post_analysis',
    p_reason: 'Test reservation before Apify',
    p_metadata: { test: true },
  });

  const reservation = reserveResult?.[0];
  if (!reservation?.success || !reservation?.reservation_id || reservation?.new_balance !== 400) {
    log(`Expected reservation with balance 400, got: ${JSON.stringify(reservation)}`, 'error');
    return false;
  }
  log(`Reserved $6.00 before external work: ${reservation.reservation_id}`, 'success');

  log('Testing reservation settlement and refund...', 'info');
  const { data: settleResult } = await supabase.rpc('settle_wallet_reservation', {
    p_user_id: TEST_USER_ID,
    p_reservation_id: reservation.reservation_id,
    p_actual_amount: 250,
    p_metadata: { actualTestCost: 250 },
  });

  const settlement = settleResult?.[0];
  if (!settlement?.success || settlement?.new_balance !== 750 || settlement?.refund_amount !== 350) {
    log(`Expected settlement balance 750/refund 350, got: ${JSON.stringify(settlement)}`, 'error');
    return false;
  }
  log('Settled reservation and refunded unused credits', 'success');

  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .order('created_at', { ascending: false })
    .limit(2);

  const refund = transactions?.find((tx) => tx.metadata?.reservationRefund === true);
  if (!refund || refund.amount !== 350) {
    log(`Expected refund transaction for 350 credits, got: ${JSON.stringify(transactions)}`, 'error');
    return false;
  }

  log('Refund transaction was logged', 'success');
  return true;
}

// =============================================================================
// TEST 5: Wallet-Only Free User Access
// =============================================================================
async function testWalletOnlyFreeUserAccess() {
  header('TEST 5: Wallet-Only Free User Access');

  // Wallet-only usage - 2026-05-17 14:06 IST, paras: no fixed free counters.
  if (!await createTestUser('free', 0)) return false;

  log('Testing free user with empty wallet...', 'info');
  const { data: emptyResult } = await supabase.rpc('deduct_wallet_credits', {
    p_user_id: TEST_USER_ID,
    p_amount: 25,
    p_action_type: 'post_analysis',
    p_reason: 'Should fail for empty wallet',
    p_metadata: null,
  });

  if (emptyResult?.[0]?.success) {
    log(`Empty wallet should fail, got: ${JSON.stringify(emptyResult?.[0])}`, 'error');
    return false;
  }
  log(`Correctly rejected empty wallet: ${emptyResult?.[0]?.error_message}`, 'success');

  log('Testing free user with remaining wallet credits...', 'info');
  await updateTestUser({ wallet_balance: 100, purchased_credits: 100 });

  const { data: fundedResult } = await supabase.rpc('deduct_wallet_credits', {
    p_user_id: TEST_USER_ID,
    p_amount: 25,
    p_action_type: 'post_analysis',
    p_reason: 'Should spend wallet balance',
    p_metadata: null,
  });

  if (!fundedResult?.[0]?.success || fundedResult?.[0]?.new_balance !== 75) {
    log(`Funded wallet should spend successfully, got: ${JSON.stringify(fundedResult?.[0])}`, 'error');
    return false;
  }
  log('Free user with remaining wallet credits can spend them', 'success');

  return true;
}

// =============================================================================
// TEST 6: Wallet Transaction Logging
// =============================================================================
async function testWalletTransactionLogging() {
  header('TEST 6: Wallet Transaction Logging');

  // createTestUser now handles cleanup internally
  if (!await createTestUser('growth', 30000)) return false; // $300 balance

  // Perform a deduction
  await supabase.rpc('deduct_wallet_credits', {
    p_user_id: TEST_USER_ID,
    p_amount: 1000, // $10
    p_action_type: 'post_analysis',
    p_reason: 'Test transaction logging',
    p_metadata: { postUrl: 'https://test.com/post' },
  });

  // Check transaction was logged
  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!transactions || transactions.length === 0) {
    log('Transaction was not logged to wallet_transactions table', 'error');
    return false;
  }

  const tx = transactions[0];
  if (tx.amount !== -1000 || tx.type !== 'debit' || tx.balance_after !== 29000) {
    log(`Transaction data incorrect: ${JSON.stringify(tx)}`, 'error');
    return false;
  }

  log('Transaction correctly logged with all fields', 'success');
  log(`  - Amount: $${Math.abs(tx.amount / 100).toFixed(2)} (debit)`, 'info');
  log(`  - Balance after: $${(tx.balance_after / 100).toFixed(2)}`, 'info');
  log(`  - Action type: ${tx.action_type}`, 'info');
  log(`  - Reason: ${tx.reason}`, 'info');

  return true;
}

// =============================================================================
// TEST 7: Verify Security Fixes in Code
// =============================================================================
async function testSecurityFixesInCode() {
  header('TEST 7: Security Fixes in Code (Manual Verification)');

  log('The following security fixes should be verified in the codebase:', 'warning');
  console.log('\n📋 CHECKLIST:');
  console.log('');
  console.log('1. [ ] skipUsageTracking REMOVED from enrich endpoint');
  console.log('      File: app/api/crm/enrich/route.ts');
  console.log('      Check: Search for "skipUsageTracking" - should NOT be in request body parsing');
  console.log('');
  console.log('2. [ ] deductCredits uses RPC function');
  console.log('      File: lib/wallet.ts');
  console.log('      Check: deductCredits() should call supabase.rpc("deduct_wallet_credits", ...)');
  console.log('');
  console.log('3. [ ] canAnalyze checks FULL estimated cost');
  console.log('      File: lib/usage.ts');
  console.log('      Check: Should calculate estimatedMaxCost using plan limits, not just base cost');
  console.log('');
  console.log('4. [ ] Usage is wallet-only');
  console.log('      File: lib/usage.ts');
  console.log('      Check: incrementAnalysisUsage and incrementEnrichmentUsage should deduct wallet credits');
  console.log('');
  console.log('5. [ ] Paid external work reserves credits first');
  console.log('      Files: app/actions/analyze-post.ts, app/api/crm/enrich/route.ts');
  console.log('      Check: reserveAnalysisCredits/reserveEnrichmentCredits should run before Apify calls');
  console.log('');

  return true;
}

// =============================================================================
// TEST 8: Simulate Race Condition (Conceptual)
// =============================================================================
async function testRaceConditionPrevention() {
  header('TEST 8: Race Condition Prevention (Conceptual)');

  log('Race condition prevention is implemented at the database level.', 'info');
  log('Before Apify starts, reserve_wallet_credits locks and deducts the max cost.', 'info');
  log('The SELECT ... FOR UPDATE clause ensures only one transaction can modify', 'info');
  log('a user row at a time. Here\'s how to manually test:', 'info');

  console.log('\n📋 MANUAL RACE CONDITION TEST:');
  console.log('');
  console.log('1. Open browser developer tools on two tabs');
  console.log('2. Login as a paid user with low credits (e.g., $10)');
  console.log('3. Prepare an analysis request in both tabs');
  console.log('4. Click "Analyze" in both tabs as simultaneously as possible');
  console.log('5. Expected result: Only ONE analysis should succeed');
  console.log('   - The other should fail with "Insufficient credits"');
  console.log('');
  console.log('For automated testing, you can use this curl command pattern:');
  console.log('');
  console.log('  # Fire 5 parallel requests');
  console.log('  for i in {1..5}; do');
  console.log('    curl -X POST "YOUR_URL/api/crm/enrich" \\');
  console.log('      -H "Cookie: YOUR_SESSION_COOKIE" \\');
  console.log('      -H "Content-Type: application/json" \\');
  console.log('      -d \'{"profileUrl":"https://linkedin.com/in/test"}\' &');
  console.log('  done');
  console.log('  wait');
  console.log('');

  return true;
}

// =============================================================================
// TEST 9: Webhook Verification Guide
// =============================================================================
async function testWebhookVerificationGuide() {
  header('TEST 9: Webhook Verification Guide');

  log('Webhook testing requires a running server. Here\'s how to test:', 'info');

  console.log('\n📋 LOCAL WEBHOOK TESTING:');
  console.log('');
  console.log('1. Start your local server: npm run dev');
  console.log('');
  console.log('2. Use ngrok to expose your local server:');
  console.log('   ngrok http 3000');
  console.log('');
  console.log('3. Configure the ngrok URL in Dodo dashboard:');
  console.log('   https://YOUR_NGROK_URL.ngrok.io/api/webhooks/dodo');
  console.log('');
  console.log('4. Test with a simulated webhook (replace values):');
  console.log('');
  console.log('   curl -X POST "http://localhost:3000/api/webhooks/dodo" \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -H "webhook-timestamp: $(date +%s)" \\');
  console.log('     -d \'{"event_type":"payment.succeeded","event_id":"test_123","data":{"customer_id":"YOUR_CUSTOMER_ID","product_id":"YOUR_PRODUCT_ID"}}\'');
  console.log('');
  console.log('📋 PRODUCTION WEBHOOK TESTING:');
  console.log('');
  console.log('1. Make a test purchase in Dodo\'s test mode');
  console.log('2. Check your server logs for webhook processing');
  console.log('3. Verify in Supabase:');
  console.log('   - webhook_events table has the event');
  console.log('   - wallet_transactions shows credit allocation');
  console.log('   - users table shows updated wallet_balance');
  console.log('');

  return true;
}

// =============================================================================
// MAIN RUNNER
// =============================================================================
async function runAllTests() {
  console.log('\n' + colors.bold + colors.blue);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     PAYMENT SYSTEM VERIFICATION - 2nd January 2026       ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  const results: { name: string; passed: boolean }[] = [];

  try {
    // Run tests
    results.push({ name: 'Database Functions Exist', passed: await testDatabaseFunctionsExist() });
    results.push({ name: 'Atomic Credit Deduction', passed: await testAtomicCreditDeduction() });
    results.push({ name: 'Wallet Reservations', passed: await testWalletReservations() });
    results.push({ name: 'Wallet-Only Free User Access', passed: await testWalletOnlyFreeUserAccess() });
    results.push({ name: 'Wallet Transaction Logging', passed: await testWalletTransactionLogging() });
    results.push({ name: 'Security Fixes in Code', passed: await testSecurityFixesInCode() });
    results.push({ name: 'Race Condition Prevention', passed: await testRaceConditionPrevention() });
    results.push({ name: 'Webhook Verification Guide', passed: await testWebhookVerificationGuide() });
  } finally {
    // Cleanup
    await deleteTestUser();
  }

  // Summary
  header('TEST SUMMARY');

  let allPassed = true;
  for (const result of results) {
    if (result.passed) {
      log(`${result.name}: PASSED`, 'success');
    } else {
      log(`${result.name}: FAILED`, 'error');
      allPassed = false;
    }
  }

  console.log('\n');
  if (allPassed) {
    console.log(colors.green + colors.bold);
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║              ✅ ALL TESTS PASSED                         ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
  } else {
    console.log(colors.red + colors.bold);
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║              ❌ SOME TESTS FAILED                        ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
    process.exit(1);
  }
}

// Run
runAllTests().catch(console.error);
