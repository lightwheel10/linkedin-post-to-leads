import { timingSafeEqual, randomInt, createHash } from 'crypto';
import { supabase } from './supabase';

// --- Types ---

interface AuthRecord {
  email: string;
  otp_hash: string | null;
  otp_expires: number | null;
  attempts: number;
  locked_until: number | null;
  requests_in_window: number;
  window_start: number;
  is_verified: boolean;
  last_request_time: number | null;
}

// --- Storage Helpers ---

async function getRecord(email: string): Promise<AuthRecord | null> {
  const { data, error } = await supabase
    .from('auth_otps')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) return null;
  return data as AuthRecord;
}

async function saveRecord(record: AuthRecord): Promise<void> {
  const { error } = await supabase
    .from('auth_otps')
    .upsert(record, { onConflict: 'email' });

  if (error) {
    throw new Error(`Failed to save auth record: ${error.message}`);
  }
}

// --- Security Helpers ---

export function generateOTP(): string {
  // Cryptographically secure random 6-digit OTP
  const otp = randomInt(100000, 999999).toString();
  return otp;
}

export function hashOTP(otp: string, email: string, secret: string): string {
  return createHash('sha256')
    .update(`${otp}:${email}:${secret}`)
    .digest('hex');
}

// Constant-time comparison to prevent timing attacks
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// --- Constants ---

const OTP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour
const COOLDOWN_WINDOW_MS = 15 * 1000; // 15 seconds
const SECRET = process.env.OTP_SECRET || 'dev-secret-do-not-use-in-prod';

// --- Auth Logic ---

export async function canRequestOTP(email: string): Promise<{ allowed: boolean; error?: string }> {
  const record = await getRecord(email);

  if (!record) return { allowed: true };

  const now = Date.now();

  // Check if locked
  if (record.locked_until && now < record.locked_until) {
    return { allowed: false, error: 'Account temporarily locked. Try again later.' };
  }

  // Check cooldown
  if (record.last_request_time && (now - record.last_request_time < COOLDOWN_WINDOW_MS)) {
    const remaining = Math.ceil((COOLDOWN_WINDOW_MS - (now - record.last_request_time)) / 1000);
    return { allowed: false, error: `Please wait ${remaining} seconds before requesting another code.` };
  }

  // Check rate limit (reset window if expired)
  let requestsInWindow = record.requests_in_window;
  if (now - record.window_start > RATE_LIMIT_WINDOW_MS) {
    requestsInWindow = 0;
  }

  if (requestsInWindow >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, error: 'Too many requests. Please wait an hour.' };
  }

  return { allowed: true };
}

export async function storeOTP(email: string, otpHash: string): Promise<void> {
  const now = Date.now();
  const existing = await getRecord(email);

  let record: AuthRecord;

  if (!existing) {
    // New record
    record = {
      email,
      otp_hash: otpHash,
      otp_expires: now + OTP_WINDOW_MS,
      attempts: 0,
      locked_until: null,
      requests_in_window: 1,
      window_start: now,
      is_verified: false,
      last_request_time: now
    };
  } else {
    // Update existing record
    let requestsInWindow = existing.requests_in_window;
    let windowStart = existing.window_start;

    // Reset rate limit window if expired
    if (now - existing.window_start > RATE_LIMIT_WINDOW_MS) {
      requestsInWindow = 0;
      windowStart = now;
    }

    record = {
      email,
      otp_hash: otpHash,
      otp_expires: now + OTP_WINDOW_MS,
      attempts: 0, // Reset attempts on new OTP
      locked_until: existing.locked_until,
      requests_in_window: requestsInWindow + 1,
      window_start: windowStart,
      is_verified: false, // Reset verification status
      last_request_time: now
    };
  }

  await saveRecord(record);
}

export async function verifyOTPInternal(email: string, submittedHash: string): Promise<{ success: boolean; error?: string; locked?: boolean }> {
  const record = await getRecord(email);
  const now = Date.now();

  if (!record) {
    return { success: false, error: 'Invalid or expired verification code.' };
  }

  // Check lock
  if (record.locked_until && now < record.locked_until) {
    return { success: false, error: 'Account locked due to too many failed attempts.', locked: true };
  }

  // Check expiration
  if (!record.otp_expires || now > record.otp_expires) {
    return { success: false, error: 'Verification code expired. Please request a new one.' };
  }

  // Verify hash
  if (record.otp_hash && safeCompare(record.otp_hash, submittedHash)) {
    // Success - clear OTP
    await saveRecord({
      ...record,
      otp_hash: null,
      otp_expires: null,
      attempts: 0,
      is_verified: true
    });
    return { success: true };
  }

  // Failed attempt
  const newAttempts = record.attempts + 1;

  if (newAttempts >= MAX_ATTEMPTS) {
    await saveRecord({
      ...record,
      otp_hash: null, // Invalidate OTP on lock
      attempts: newAttempts,
      locked_until: now + LOCKOUT_DURATION_MS
    });
    return { success: false, error: 'Too many failed attempts. Account locked for 1 hour.', locked: true };
  }

  await saveRecord({
    ...record,
    attempts: newAttempts
  });
  return { success: false, error: 'Invalid verification code.' };
}

export const OTP_CONSTANTS = {
  SECRET
};
