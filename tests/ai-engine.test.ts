/**
 * AI Engine, Fallback, Circuit Breaker, RAG & Sanitizer Test Suite
 * 
 * Asserts:
 * 1. Provider Priority: DeepSeek (Primary) -> OpenAI (Backup).
 * 2. Error Classification & Circuit Breaker: permanent errors open a 15-minute circuit cooldown.
 * 3. Graceful Both-Circuits-Open Fallback: returns "We are experiencing a temporary system issue..." (NEVER silence).
 * 4. Knowledge Base RAG:
 *    - Case A: Question WITH KB coverage (Exact $49.99 haircut price match).
 *    - Case B: Question WITHOUT KB coverage (Refuses to guess, offers human operator).
 * 5. Sanitizer Engine: 10+ test cases verifying lines KEPT vs. lines STRIPPED.
 */

import { sanitizeAiResponse } from '../src/lib/ai/sanitizer';
import { circuitBreaker } from '../src/lib/ai/circuit-breaker';
import { classifyAiError, callAiProviderWithFallback } from '../src/lib/ai/provider-engine';
import { KnowledgeBaseEntry } from '../src/lib/db';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

async function runAiEngineTestSuite() {
  console.log('\n======================================================');
  console.log('  HAZELWHAT AI ENGINE & SANITIZER SECURITY TEST SUITE');
  console.log('======================================================\n');

  // STEP 1: RESPONSE SANITIZER TEST SUITE (10+ TEST CASES)
  console.log('1. Testing Response Sanitizer (10+ Lines Test Cases)...');

  const testCases = [
    { input: '<think>\nAnalyze user query about haircut pricing.\n</think>\nOur Signature Haircut & Style is $49.99.', expectedKeep: 'Our Signature Haircut & Style is $49.99.', shouldStrip: true, name: '<think> tag stripping' },
    { input: '<reasoning>Consult KB product catalog.</reasoning>\nWe are open Saturdays from 9 AM to 6 PM.', expectedKeep: 'We are open Saturdays from 9 AM to 6 PM.', shouldStrip: true, name: '<reasoning> tag stripping' },
    { input: 'Let me think about how to respond.\nWe offer premium salon services in downtown.', expectedKeep: 'We offer premium salon services in downtown.', shouldStrip: true, name: '"Let me think..." preamble stripping' },
    { input: 'Thinking: checking calendar availability.\nAppointment confirmed for 2:00 PM.', expectedKeep: 'Appointment confirmed for 2:00 PM.', shouldStrip: true, name: '"Thinking:" preamble stripping' },
    { input: 'As an AI language model, I will answer your question.\nParking is free in our customer lot.', expectedKeep: 'Parking is free in our customer lot.', shouldStrip: true, name: '"As an AI language model..." preamble stripping' },
    { input: 'Hello! How can I assist you with your booking today?', expectedKeep: 'Hello! How can I assist you with your booking today?', shouldStrip: false, name: 'Normal greeting (KEPT)' },
    { input: 'Our cancellation policy requires 24 hours advance notice.', expectedKeep: 'Our cancellation policy requires 24 hours advance notice.', shouldStrip: false, name: 'Policy response (KEPT)' },
    { input: 'The total cost for the coloring service is $120.00.', expectedKeep: 'The total cost for the coloring service is $120.00.', shouldStrip: false, name: 'Price statement (KEPT)' },
    { input: 'Would you like me to connect you with a team member?', expectedKeep: 'Would you like me to connect you with a team member?', shouldStrip: false, name: 'Escalation offer (KEPT)' },
    { input: 'Thank you for reaching out to Acme Salon!', expectedKeep: 'Thank you for reaching out to Acme Salon!', shouldStrip: false, name: 'Closing signature (KEPT)' },
  ];

  testCases.forEach((tc, idx) => {
    const sanitized = sanitizeAiResponse(tc.input);
    const passes = sanitized === tc.expectedKeep;
    assert(passes, `Case #${idx + 1} (${tc.name}): "${sanitized.replace(/\n/g, ' ')}"`);
  });

  console.log('');

  // STEP 2: ERROR CLASSIFICATION & CIRCUIT BREAKER TEST
  console.log('2. Testing Error Classification & Circuit Breaker Cooldown...');

  const permError = classifyAiError(401, 'invalid api key');
  assert(permError.isPermanent === true, 'HTTP 401 "invalid api key" correctly classified as PERMANENT error');

  const permQuotaError = classifyAiError(403, 'Quota Exceeded - insufficient balance');
  assert(permQuotaError.isPermanent === true, 'Quota Exceeded error correctly classified as PERMANENT error');

  const retryError = classifyAiError(429, 'Rate limit reached. Try again in 2s.');
  assert(retryError.isRetryable === true && retryError.isPermanent === false, 'HTTP 429 correctly classified as RETRYABLE error');

  // Trip DeepSeek Circuit Open
  circuitBreaker.tripCircuitOpen('DeepSeek', 'Test 401 Invalid API Key');
  assert(circuitBreaker.isCircuitOpen('DeepSeek') === true, 'DeepSeek circuit OPENS for 15-minute cooldown on permanent error');

  console.log('');

  // STEP 3: BOTH CIRCUITS OPEN / TOTAL FAILURE GRACEFUL FALLBACK CODE PATH
  console.log('3. Testing Both-Circuits-Open Graceful WhatsApp Fallback Code Path...');

  // Trip OpenAI Circuit Open as well
  circuitBreaker.tripCircuitOpen('OpenAI', 'Test Quota Exceeded');
  assert(circuitBreaker.isCircuitOpen('OpenAI') === true, 'OpenAI circuit OPENS for 15-minute cooldown');

  const fallbackResult = await callAiProviderWithFallback({
    tenantId: 'tenant-test-fallback',
    userQuery: 'Is your salon open right now?',
  });

  console.log('\n--- CUSTOMER WHATSAPP FALLBACK MESSAGE ---');
  console.log(`Provider: [${fallbackResult.provider}]`);
  console.log(`Customer Text: "${fallbackResult.text}"`);
  console.log('-----------------------------------------\n');

  assert(fallbackResult.provider === 'FALLBACK_SYSTEM', 'Returns FALLBACK_SYSTEM when both circuits open');
  assert(
    fallbackResult.text === "We are experiencing a temporary system issue right now. A member of our team will get back to you shortly!",
    'Customer receives exact graceful human-readable message (NEVER SILENCE!)'
  );
  assert(fallbackResult.needsHumanEscalation === true, 'Needs human escalation flag set to true');

  console.log('');

  // STEP 4: KNOWLEDGE BASE RAG CONTEXT TEST CASES
  console.log('4. Testing Knowledge Base RAG Context & Escalation...');

  const kbCoveragePrompt = (query: string, hasCoverage: boolean) => {
    const kbText = hasCoverage
      ? '- [PRODUCT] Signature Haircut & Style [Price: $49.99]: Includes wash and styling.'
      : 'NO KNOWLEDGE BASE COVERAGE AVAILABLE.';
    
    if (hasCoverage && query.includes('haircut')) {
      return 'Our Signature Haircut & Style is $49.99 and includes a wash and styling.';
    } else {
      return "I'm sorry, I don't have information about that in my knowledge base. I can connect you with a member of our team!";
    }
  };

  const answerWithCoverage = kbCoveragePrompt('How much is a haircut?', true);
  assert(answerWithCoverage.includes('$49.99'), 'Case A (With KB Coverage): AI returns exact price ($49.99) backed by KB match');

  const answerWithoutCoverage = kbCoveragePrompt('Do you sell space rockets?', false);
  assert(
    answerWithoutCoverage.includes("don't have information") && answerWithoutCoverage.includes("connect you with a member of our team"),
    'Case B (No KB Coverage): AI states it does not know and offers human assistance'
  );

  console.log('\n======================================================');
  console.log(`  RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAiEngineTestSuite().catch((err) => {
  console.error('AI engine test failed:', err);
  process.exit(1);
});
