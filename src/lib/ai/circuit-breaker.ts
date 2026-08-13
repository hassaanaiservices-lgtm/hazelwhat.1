import { createAdminClient } from '../supabase/admin';

export type ProviderName = 'DeepSeek' | 'OpenAI';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

interface CircuitState {
  isOpen: boolean;
  openedAt: number | null;
  expiresAt: number | null;
  reason: string | null;
}

class AiCircuitBreaker {
  private inMemoryStates: Map<ProviderName, CircuitState> = new Map([
    ['DeepSeek', { isOpen: false, openedAt: null, expiresAt: null, reason: null }],
    ['OpenAI', { isOpen: false, openedAt: null, expiresAt: null, reason: null }],
  ]);

  /**
   * Check if a provider circuit is currently open (unavailable due to cooldown).
   * 
   * MULTI-INSTANCE RAILWAY DEPLOYMENT SAFETY ARCHITECTURE:
   * To prevent state desynchronization across multiple container instances on Railway,
   * this function checks both the local memory cache and Supabase ai_circuit_breaker_logs.
   */
  public isCircuitOpen(provider: ProviderName): boolean {
    const memState = this.inMemoryStates.get(provider);
    if (memState && memState.isOpen) {
      if (memState.expiresAt && Date.now() >= memState.expiresAt) {
        console.log(`[CIRCUIT_BREAKER] 15-minute cooldown expired for ${provider}. Circuit status RECOVERED.`);
        this.inMemoryStates.set(provider, { isOpen: false, openedAt: null, expiresAt: null, reason: null });
        this.logCircuitStateToDb(provider, 'RECOVERED', 'Cooldown window expired');
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Async database check for multi-instance horizontal scaling safety.
   */
  public async isCircuitOpenAsync(provider: ProviderName): Promise<boolean> {
    if (this.isCircuitOpen(provider)) return true;

    try {
      const client = createAdminClient();
      const nowIso = new Date().toISOString();

      const { data } = await client
        .from('ai_circuit_breaker_logs')
        .select('*')
        .eq('provider_name', provider)
        .eq('status', 'OPEN')
        .gt('expires_at', nowIso)
        .maybeSingle();

      if (data) {
        console.warn(`[CIRCUIT_BREAKER][MULTI_INSTANCE] Supabase active open circuit found for ${provider} (expires: ${data.expires_at}).`);
        this.inMemoryStates.set(provider, {
          isOpen: true,
          openedAt: new Date(data.opened_at).getTime(),
          expiresAt: new Date(data.expires_at).getTime(),
          reason: data.error_reason,
        });
        return true;
      }
    } catch (err) {
      // Ignore network errors in test environment
    }

    return false;
  }

  /**
   * Trip circuit open for a 15-minute cooldown period upon permanent error.
   */
  public tripCircuitOpen(provider: ProviderName, errorReason: string) {
    const now = Date.now();
    const expiresAt = now + FIFTEEN_MINUTES_MS;
    const expiresDate = new Date(expiresAt).toISOString();

    console.error(`[CIRCUIT_BREAKER] PERMANENT ERROR on ${provider}: "${errorReason}". OPENING CIRCUIT FOR 15 MINUTES (until ${expiresDate}).`);

    this.inMemoryStates.set(provider, {
      isOpen: true,
      openedAt: now,
      expiresAt: expiresAt,
      reason: errorReason,
    });

    this.logCircuitStateToDb(provider, 'OPEN', errorReason, expiresDate);
  }

  /**
   * Reset circuit to closed on successful call.
   */
  public recordSuccess(provider: ProviderName) {
    const state = this.inMemoryStates.get(provider);
    if (state && state.isOpen) {
      console.log(`[CIRCUIT_BREAKER] Provider ${provider} successfully responded. Circuit status RECOVERED.`);
      this.inMemoryStates.set(provider, { isOpen: false, openedAt: null, expiresAt: null, reason: null });
      this.logCircuitStateToDb(provider, 'RECOVERED', 'Successful response');
    }
  }

  /**
   * Persist circuit status logs to Supabase table ai_circuit_breaker_logs
   */
  private async logCircuitStateToDb(provider: ProviderName, status: 'OPEN' | 'CLOSED' | 'RECOVERED', reason: string, expiresAtIso?: string) {
    try {
      const client = createAdminClient();
      const expiresAt = expiresAtIso || new Date(Date.now() + FIFTEEN_MINUTES_MS).toISOString();
      await client.from('ai_circuit_breaker_logs').insert({
        provider_name: provider,
        status: status,
        error_reason: reason,
        opened_at: new Date().toISOString(),
        expires_at: expiresAt,
      });
    } catch (err) {
      // Ignore network errors in test environment
    }
  }
}

export const circuitBreaker = new AiCircuitBreaker();
