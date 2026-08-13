/**
 * AI Response Sanitizer Engine (src/lib/ai/sanitizer.ts)
 * 
 * ARCHITECTURAL MANDATE:
 * Strips any internal reasoning, preambles, meta-commentary, or system thinking tags
 * (e.g. <think>...</think>, "Let me think about how to respond", "I will help you as an AI")
 * from the raw LLM output before it is dispatched as a customer-facing WhatsApp reply.
 */

export function sanitizeAiResponse(rawOutput: string): string {
  if (!rawOutput || typeof rawOutput !== 'string') return '';

  let cleaned = rawOutput;

  // 1. Remove XML/HTML style reasoning tags (e.g. <think>...</think>, <reasoning>...</reasoning>)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, '');

  // 2. Split lines and filter out preamble lines matching meta-commentary patterns
  const lines = cleaned.split('\n');
  const filteredLines: string[] = [];

  const metaPatterns = [
    /^let me think/i,
    /^thinking:/i,
    /^here is (a|the) response/i,
    /^as an ai (assistant|language model|employee)/i,
    /^i will answer this as/i,
    /^i should respond by/i,
    /^based on the knowledge base/i,
    /^according to the system prompt/i,
    /^internal reasoning:/i,
    /^step-by-step thinking:/i,
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line matches any meta-commentary pattern
    const isMetaLine = metaPatterns.some((pattern) => pattern.test(trimmed));
    if (!isMetaLine) {
      filteredLines.push(line);
    }
  }

  // Rejoin and trim output
  return filteredLines.join('\n').trim();
}
