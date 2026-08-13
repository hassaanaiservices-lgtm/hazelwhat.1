/**
 * Authentication & Middleware Security Test Suite
 * 
 * Asserts:
 * 1. Password security: bcrypt hashing and secure random password generation (entropy, length, charsets).
 * 2. JWT session creation and verification.
 * 3. Middleware route protection:
 *    - Client-role JWT rejected on /admin/* (403).
 *    - Tampered/invalid JWT rejected everywhere (401).
 *    - No cookie rejected (401, not default role).
 *    - Authorized roles permitted.
 */

import { NextRequest } from 'next/server';
import { middleware } from '../src/middleware';
import { signSessionToken, SESSION_COOKIE_NAME } from '../src/lib/auth/jwt';
import { hashPassword, verifyPassword, generateSecureRandomPassword } from '../src/lib/auth/password';

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

// Helper to create a NextRequest with optional cookie
function createMockRequest(path: string, cookieValue?: string): NextRequest {
  const url = `http://localhost:3000${path}`;
  const headers = new Headers();
  if (cookieValue !== undefined) {
    headers.set('cookie', `${SESSION_COOKIE_NAME}=${cookieValue}`);
  }
  return new NextRequest(url, { headers });
}

async function runAuthTestSuite() {
  console.log('\n======================================================');
  console.log('  HAZELWHAT AUTHENTICATION & MIDDLEWARE SECURITY TESTS');
  console.log('======================================================\n');

  // STEP 1: PASSWORD HASHING & GENERATION SECURITY TESTS
  console.log('1. Testing Password Security & Hashing...');

  const plainPass = 'MySecretPassword123!';
  const hash = await hashPassword(plainPass);
  
  assert(hash !== plainPass, 'Password is never stored in plaintext');
  assert(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'Password is valid bcrypt hash');

  const isValidMatch = await verifyPassword(plainPass, hash);
  assert(isValidMatch === true, 'bcrypt correctly verifies valid password');

  const isInvalidMatch = await verifyPassword('WrongPassword123!', hash);
  assert(isInvalidMatch === false, 'bcrypt rejects invalid password');

  const generatedPass = generateSecureRandomPassword(16);
  assert(generatedPass.length >= 12, 'Auto-generated password minimum length is >= 12 chars (actual: ' + generatedPass.length + ')');
  assert(/[A-Z]/.test(generatedPass), 'Contains uppercase characters');
  assert(/[a-z]/.test(generatedPass), 'Contains lowercase characters');
  assert(/[0-9]/.test(generatedPass), 'Contains numeric digits');
  assert(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(generatedPass), 'Contains special symbols');

  console.log('');

  // STEP 2: JWT SIGNING & VERIFICATION TESTS
  console.log('2. Testing JWT Session Tokens...');

  const adminToken = await signSessionToken({ role: 'admin' });
  const clientToken = await signSessionToken({ role: 'client', tenantId: 'tenant-1234' });

  assert(typeof adminToken === 'string' && adminToken.split('.').length === 3, 'Admin JWT token successfully generated (3 segments)');
  assert(typeof clientToken === 'string' && clientToken.split('.').length === 3, 'Client JWT token successfully generated (3 segments)');

  console.log('');

  // STEP 3: MIDDLEWARE ROUTE PROTECTION ASSERTS
  console.log('3. Testing Middleware Access Control & Route Guarding...');

  // Assertion A: Missing cookie on /admin/* route -> 401
  const reqNoCookieAdmin = createMockRequest('/admin/dashboard');
  const resNoCookieAdmin = await middleware(reqNoCookieAdmin);
  assert(resNoCookieAdmin.status === 401, 'Request with NO cookie on /admin/dashboard returns HTTP 401 (Not treated as default role)');

  // Assertion B: Missing cookie on /client/* route -> 401
  const reqNoCookieClient = createMockRequest('/client/messages');
  const resNoCookieClient = await middleware(reqNoCookieClient);
  assert(resNoCookieClient.status === 401, 'Request with NO cookie on /client/messages returns HTTP 401');

  // Assertion C: Tampered / Invalid JWT on /admin/* route -> 401
  const reqTamperedAdmin = createMockRequest('/admin/settings', 'tampered.jwt.token');
  const resTamperedAdmin = await middleware(reqTamperedAdmin);
  assert(resTamperedAdmin.status === 401, 'Tampered/Invalid JWT on /admin/settings returns HTTP 401');

  // Assertion D: Tampered / Invalid JWT on /client/* route -> 401
  const reqTamperedClient = createMockRequest('/client/orders', 'tampered.jwt.token');
  const resTamperedClient = await middleware(reqTamperedClient);
  assert(resTamperedClient.status === 401, 'Tampered/Invalid JWT on /client/orders returns HTTP 401');

  // Assertion E: Client-role JWT on /admin/* route -> 403 REJECTED
  const reqClientOnAdmin = createMockRequest('/admin/users', clientToken);
  const resClientOnAdmin = await middleware(reqClientOnAdmin);
  assert(resClientOnAdmin.status === 403, 'Client-role JWT on /admin/users route is REJECTED with HTTP 403 Forbidden');

  // Assertion F: Admin-role JWT on /client/* route -> 403 REJECTED
  const reqAdminOnClient = createMockRequest('/client/profile', adminToken);
  const resAdminOnClient = await middleware(reqAdminOnClient);
  assert(resAdminOnClient.status === 403, 'Admin-role JWT on /client/profile route is REJECTED with HTTP 403 Forbidden');

  // Assertion G: Valid Admin JWT on /admin/* route -> 200 PERMITTED
  const reqValidAdmin = createMockRequest('/admin/dashboard', adminToken);
  const resValidAdmin = await middleware(reqValidAdmin);
  assert(resValidAdmin.status === 200, 'Valid Admin JWT on /admin/dashboard PERMITTED with HTTP 200');

  // Assertion H: Valid Client JWT on /client/* route -> 200 PERMITTED
  const reqValidClient = createMockRequest('/client/dashboard', clientToken);
  const resValidClient = await middleware(reqValidClient);
  assert(resValidClient.status === 200, 'Valid Client JWT on /client/dashboard PERMITTED with HTTP 200');

  console.log('\n======================================================');
  console.log(`  RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAuthTestSuite().catch((err) => {
  console.error('Auth test execution failed:', err);
  process.exit(1);
});
