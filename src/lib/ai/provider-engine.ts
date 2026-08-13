import { getKnowledgeBaseEntries, getTenantConfig, KnowledgeBaseEntry } from '../db';
import { circuitBreaker, ProviderName } from './circuit-breaker';
import { sanitizeAiResponse } from './sanitizer';

export interface AiResponseResult {
  provider: ProviderName | 'FALLBACK_SYSTEM';
  text: string;
  needsHumanEscalation: boolean;
  rawResponse?: string;
}

export interface ErrorClassification {
  isPermanent: boolean;
  isRetryable: boolean;
  reason: string;
}

/**
 * Error Classifier Function
 * Distinguishes retryable errors (429, 500/502/503, timeouts) from permanent errors
 * (401, 402/403, "insufficient balance", "invalid api key", "quota exceeded").
 */
export function classifyAiError(status: number, message: string): ErrorClassification {
  const msgLower = (message || '').toLowerCase();

  const permanentStrings = [
    'insufficient balance',
    'invalid api key',
    'invalid_api_key',
    'quota exceeded',
    'quota_exceeded',
    'payment required',
    'account_deactivated',
    'billing',
  ];

  const hasPermanentString = permanentStrings.some((str) => msgLower.includes(str));

  if (status === 401 || status === 402 || status === 403 || hasPermanentString) {
    return {
      isPermanent: true,
      isRetryable: false,
      reason: `Permanent Auth/Billing Failure (${status}): ${message}`,
    };
  }

  if (status === 429 || status >= 500 || msgLower.includes('timeout') || msgLower.includes('rate limit')) {
    return {
      isPermanent: false,
      isRetryable: true,
      reason: `Retryable Server/Rate Limit Error (${status}): ${message}`,
    };
  }

  return {
    isPermanent: false,
    isRetryable: true,
    reason: `Unknown Error (${status}): ${message}`,
  };
}

/**
 * Format Knowledge Base Entries into RAG Context
 */
function buildRagContext(kbEntries: KnowledgeBaseEntry[]): string {
  if (!kbEntries || kbEntries.length === 0) {
    return 'NO KNOWLEDGE BASE COVERAGE AVAILABLE.';
  }

  const formatted = kbEntries.map((e) => {
    let extra = '';
    if (e.entry_type === 'product' && e.metadata?.price !== undefined) {
      extra = ` [Price: $${e.metadata.price}]`;
    }
    return `- [${e.entry_type.toUpperCase()}] ${e.title}${extra}: ${e.content}`;
  });

  return formatted.join('\n');
}

/**
 * SINGLE EXPLICIT PROVIDER PRIORITY FUNCTION
 * DeepSeek (Primary) -> OpenAI (Backup) -> Graceful Fallback Message
 */
export async function callAiProviderWithFallback(params: {
  tenantId: string;
  userQuery: string;
  senderPhone?: string;
}): Promise<AiResponseResult> {
  const { tenantId, userQuery } = params;

  // 1. Fetch Tenant Config & Knowledge Base RAG Context
  let config = null;
  let kbEntries: KnowledgeBaseEntry[] = [];

  try {
    config = await getTenantConfig(tenantId);
    kbEntries = await getKnowledgeBaseEntries(tenantId);
  } catch (err) {
    // Fallback context in test or offline environment
  }

  const ragContext = buildRagContext(kbEntries);
  const businessName = config?.business_name || 'Business';
  const customPrompt = config?.settings?.system_prompt || '';

  const systemPrompt = `You are an AI employee for ${businessName}.
Answer customer questions accurately, politely, and concisely for WhatsApp.

STRICT KNOWLEDGE BASE RULES:
1. You MUST NEVER state a specific price, policy, or fact that is NOT explicitly supported in the Knowledge Base context below.
2. If no relevant match exists in the Knowledge Base context, state that you do not know and offer to connect the customer with a member of the team.
3. If you are uncertain or the query requires human action, include the tag [NEEDS_HUMAN] in your output.

KNOWLEDGE BASE CONTEXT FOR ${businessName}:
${ragContext}

${customPrompt}`;

  // 2. ATTEMPT PROVIDER 1: DEEPSEEK (PRIMARY)
  if (!circuitBreaker.isCircuitOpen('DeepSeek')) {
    const deepSeekResult = await callDeepSeekApi(systemPrompt, userQuery);
    if (deepSeekResult.success && deepSeekResult.text) {
      console.log(`[AI_PIPELINE][TENANT:${tenantId}] Handled by provider: DeepSeek`);
      circuitBreaker.recordSuccess('DeepSeek');
      
      const sanitized = sanitizeAiResponse(deepSeekResult.text);
      const needsHuman = deepSeekResult.text.includes('[NEEDS_HUMAN]') || sanitized.includes('[NEEDS_HUMAN]');
      const cleanText = sanitized.replace('[NEEDS_HUMAN]', '').trim();

      return {
        provider: 'DeepSeek',
        text: cleanText,
        needsHumanEscalation: needsHuman,
        rawResponse: deepSeekResult.text,
      };
    } else {
      const errInfo = classifyAiError(deepSeekResult.status || 500, deepSeekResult.error || 'DeepSeek call failed');
      if (errInfo.isPermanent) {
        circuitBreaker.tripCircuitOpen('DeepSeek', errInfo.reason);
      }
    }
  } else {
    console.warn(`[AI_PIPELINE][TENANT:${tenantId}] DeepSeek circuit is OPEN. Skipping primary provider.`);
  }

  // 3. ATTEMPT PROVIDER 2: OPENAI (BACKUP)
  if (!circuitBreaker.isCircuitOpen('OpenAI')) {
    const openAiResult = await callOpenAiApi(systemPrompt, userQuery);
    if (openAiResult.success && openAiResult.text) {
      console.log(`[AI_PIPELINE][TENANT:${tenantId}] Handled by provider: OpenAI`);
      circuitBreaker.recordSuccess('OpenAI');

      const sanitized = sanitizeAiResponse(openAiResult.text);
      const needsHuman = openAiResult.text.includes('[NEEDS_HUMAN]') || sanitized.includes('[NEEDS_HUMAN]');
      const cleanText = sanitized.replace('[NEEDS_HUMAN]', '').trim();

      return {
        provider: 'OpenAI',
        text: cleanText,
        needsHumanEscalation: needsHuman,
        rawResponse: openAiResult.text,
      };
    } else {
      const errInfo = classifyAiError(openAiResult.status || 500, openAiResult.error || 'OpenAI call failed');
      if (errInfo.isPermanent) {
        circuitBreaker.tripCircuitOpen('OpenAI', errInfo.reason);
      }
    }
  } else {
    console.warn(`[AI_PIPELINE][TENANT:${tenantId}] OpenAI circuit is OPEN. Skipping backup provider.`);
  }

  // 4. TOTAL FAILURE / BOTH CIRCUITS OPEN GRACEFUL FALLBACK CODE PATH
  console.error(
    `[AI_PIPELINE][WARNING][TENANT:${tenantId}] Both DeepSeek and OpenAI providers unavailable. Returning graceful customer fallback reply.`
  );

  const gracefulFallbackText = `We are experiencing a temporary system issue right now. A member of our team will get back to you shortly!`;

  return {
    provider: 'FALLBACK_SYSTEM',
    text: gracefulFallbackText,
    needsHumanEscalation: true,
  };
}

/**
 * DeepSeek API Caller
 */
async function callDeepSeekApi(systemPrompt: string, userQuery: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'placeholder-deepseek-key') {
    return { success: false, status: 401, error: 'invalid api key' };
  }

  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { success: false, status: res.status, error: errJson.error?.message || res.statusText };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return { success: true, text: reply };
  } catch (err: any) {
    return { success: false, status: 500, error: err.message };
  }
}

/**
 * OpenAI API Caller
 */
async function callOpenAiApi(systemPrompt: string, userQuery: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'placeholder-openai-key') {
    return { success: false, status: 401, error: 'invalid api key' };
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { success: false, status: res.status, error: errJson.error?.message || res.statusText };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return { success: true, text: reply };
  } catch (err: any) {
    return { success: false, status: 500, error: err.message };
  }
}
