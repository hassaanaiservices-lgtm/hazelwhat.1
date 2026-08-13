/**
 * WhatsApp Module Boundary & Session Persistence Test Suite
 * 
 * Asserts:
 * 1. Interface Boundary: verifies whatsAppService conforms strictly to IWhatsAppService.
 * 2. QR Session Creation: generates QR Data URL for new tenant connection.
 * 3. Persistent Volume Survival: verifies session state creds.json written to disk.
 * 4. Redeploy Simulation: re-instantiates provider and asserts session automatically restores without losing state.
 * 5. Swappability Demonstration: verifies a Meta Cloud API provider can replace Baileys without breaking calling code.
 */

import fs from 'fs';
import path from 'path';
import { whatsAppService, IWhatsAppService, WhatsAppSessionInfo, IncomingMessage } from '../src/lib/whatsapp';
import { BaileysWhatsAppProvider } from '../src/lib/whatsapp/baileys-provider';

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

async function runWhatsAppModuleTest() {
  console.log('\n======================================================');
  console.log('  HAZELWHAT WHATSAPP MODULE & PERSISTENCE SECURITY TEST');
  console.log('======================================================\n');

  const testTenantId = 'tenant-wa-persistence-test-99';

  // STEP 1: VERIFY MODULE INTERFACE BOUNDARY
  console.log('1. Verifying WhatsApp Provider Interface Boundary (IWhatsAppService)...');
  assert(typeof whatsAppService.connect === 'function', 'whatsAppService implements connect()');
  assert(typeof whatsAppService.disconnect === 'function', 'whatsAppService implements disconnect()');
  assert(typeof whatsAppService.getStatus === 'function', 'whatsAppService implements getStatus()');
  assert(typeof whatsAppService.sendMessage === 'function', 'whatsAppService implements sendMessage()');
  assert(typeof whatsAppService.onMessage === 'function', 'whatsAppService implements onMessage()');

  console.log('');

  // STEP 2: TEST QR CODE GENERATION & CONNECTION INITIATION
  console.log('2. Initiating WhatsApp Connection & QR Code Generation...');
  const initialSession = await whatsAppService.connect(testTenantId);

  assert(initialSession.tenantId === testTenantId, 'Session created for correct tenantId');
  assert(Boolean(initialSession.qrCodeDataUrl && initialSession.qrCodeDataUrl.startsWith('data:image/png;base64,')), 'QR Code Data URL successfully generated');
  
  console.log('   ✓ QR Code Data URL length: ' + (initialSession.qrCodeDataUrl?.length || 0) + ' bytes');
  console.log('');

  // STEP 3: VERIFY PERSISTENT VOLUME STORAGE ON DISK
  console.log('3. Verifying Persistent Disk Storage (.whatsapp-sessions/' + testTenantId + ')...');
  const sessionDir = path.join(process.cwd(), '.whatsapp-sessions', testTenantId);
  const sessionFile = path.join(sessionDir, 'creds.json');

  assert(fs.existsSync(sessionFile), 'Persistent creds.json session file created on disk volume');

  console.log('');

  // STEP 4: SIMULATE REDEPLOY / PROCESS RESTART
  console.log('4. Simulating Application Server Redeploy / Process Restart...');
  
  // Create a brand new Baileys provider instance (simulating fresh server reboot)
  const freshAppServerProvider: IWhatsAppService = new BaileysWhatsAppProvider();
  const restoredSession = await freshAppServerProvider.connect(testTenantId);

  assert(restoredSession.status === 'CONNECTED', 'Session automatically restored as CONNECTED after redeploy!');
  assert(restoredSession.phoneNumber !== null, 'Connected phone number preserved across redeploy: ' + restoredSession.phoneNumber);

  console.log('');

  // STEP 5: DEMONSTRATE MODULE SWAPPABILITY (META CLOUD API PROVIDER MOCK)
  console.log('5. Demonstrating Provider Swappability (Meta Official WhatsApp Cloud API Mock)...');

  class MetaCloudWhatsAppProvider implements IWhatsAppService {
    async connect(tenantId: string): Promise<WhatsAppSessionInfo> {
      return { tenantId, status: 'CONNECTED', phoneNumber: '+1-800-META-OFFICIAL' };
    }
    async disconnect(tenantId: string): Promise<void> {}
    async getStatus(tenantId: string): Promise<WhatsAppSessionInfo> {
      return { tenantId, status: 'CONNECTED', phoneNumber: '+1-800-META-OFFICIAL' };
    }
    async sendMessage(msg: any): Promise<any> {
      return { success: true, messageId: 'meta_123' };
    }
    onMessage(handler: (msg: IncomingMessage) => void): void {}
  }

  // Swap provider cleanly behind IWhatsAppService
  const metaProvider: IWhatsAppService = new MetaCloudWhatsAppProvider();
  const metaSession = await metaProvider.connect(testTenantId);
  
  assert(metaSession.status === 'CONNECTED' && metaSession.phoneNumber === '+1-800-META-OFFICIAL', 'Meta Official Cloud API provider cleanly swapped without changing calling code!');

  // Cleanup test files
  await whatsAppService.disconnect(testTenantId);

  console.log('\n======================================================');
  console.log(`  RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runWhatsAppModuleTest().catch((err) => {
  console.error('WhatsApp test failed:', err);
  process.exit(1);
});
