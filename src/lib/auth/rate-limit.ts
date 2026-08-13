/**
 * Login Rate Limiter Module (src/lib/auth/rate-limit.ts)
 * 
 * SECURITY MANDATE:
 * Tracks failed login attempts per identifier (username / IP).
 * After 5 failed attempts within 15 minutes, blocks further attempts for 15 minutes
 * with explicit rate-limit status (HTTP 429) rather than generic failure.
 */

interface RateLimitRecord {
  failedCount: number;
  blockedUntil: number | null;
  firstAttemptTime: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const COOLDOWN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

class LoginRateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();

  /**
   * Check if identifier is currently rate limited.
   */
  public isRateLimited(identifier: string): { isLimited: boolean; retryAfterSeconds?: number; reason?: string } {
    if (!identifier) return { isLimited: false };

    const key = identifier.trim().toLowerCase();
    const record = this.records.get(key);

    if (!record) return { isLimited: false };

    const now = Date.now();

    // Check if currently blocked under 15-minute cooldown
    if (record.blockedUntil && now < record.blockedUntil) {
      const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      return {
        isLimited: true,
        retryAfterSeconds: remainingSeconds,
        reason: `Too many failed login attempts. Please try again after 15 minutes.`,
      };
    }

    // Reset window if 15 minutes have passed since first attempt
    if (now - record.firstAttemptTime >= COOLDOWN_WINDOW_MS) {
      this.records.delete(key);
      return { isLimited: false };
    }

    return { isLimited: false };
  }

  /**
   * Record a failed login attempt for identifier.
   */
  public recordFailedAttempt(identifier: string) {
    if (!identifier) return;

    const key = identifier.trim().toLowerCase();
    const now = Date.now();
    const record = this.records.get(key);

    if (!record) {
      this.records.set(key, {
        failedCount: 1,
        blockedUntil: null,
        firstAttemptTime: now,
      });
      return;
    }

    // Reset count if window expired
    if (now - record.firstAttemptTime >= COOLDOWN_WINDOW_MS) {
      this.records.set(key, {
        failedCount: 1,
        blockedUntil: null,
        firstAttemptTime: now,
      });
      return;
    }

    record.failedCount += 1;

    // Block on 5th failed attempt
    if (record.failedCount >= MAX_FAILED_ATTEMPTS) {
      record.blockedUntil = now + COOLDOWN_WINDOW_MS;
      console.warn(
        `[SECURITY][RATE_LIMIT] Identifier '${key}' exceeded 5 failed login attempts. BLOCKED FOR 15 MINUTES.`
      );
    }
  }

  /**
   * Reset rate limit state on successful login.
   */
  public resetOnSuccess(identifier: string) {
    if (!identifier) return;
    const key = identifier.trim().toLowerCase();
    this.records.delete(key);
  }
}

export const loginRateLimiter = new LoginRateLimiter();
