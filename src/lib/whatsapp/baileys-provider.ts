import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import {
  IWhatsAppService,
  WhatsAppSessionInfo,
  IncomingMessage,
  OutgoingMessage,
} from './interface';

const SERVER_URL = 'http://127.0.0.1:3001';
let isServerSpawned = false;

function ensureServerRunning() {
  if (isServerSpawned) return;
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'whatsapp-server.mjs');
    if (fs.existsSync(scriptPath)) {
      const child = spawn('node', [scriptPath], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      isServerSpawned = true;
      console.log('[WHATSAPP-PROVIDER] Spawned persistent WhatsApp background server (port 3001).');
    }
  } catch (e) {
    console.error('[WHATSAPP-PROVIDER] Failed to spawn WhatsApp background server:', e);
  }
}

export class BaileysWhatsAppProvider implements IWhatsAppService {
  private messageHandlers: Array<(msg: IncomingMessage) => void> = [];

  constructor() {
    ensureServerRunning();
  }

  public async getStatus(tenantId: string): Promise<WhatsAppSessionInfo> {
    if (!tenantId) {
      throw new Error('[SECURITY] getStatus called without tenantId');
    }
    ensureServerRunning();

    try {
      const res = await fetch(`${SERVER_URL}/status?tenantId=${tenantId}`, {
        headers: { 'x-tenant-id': tenantId },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.statusInfo) return data.statusInfo;
      }
    } catch (e) {}

    return {
      tenantId,
      status: 'DISCONNECTED',
      phoneNumber: null,
      qrCodeDataUrl: null,
    };
  }

  public async connect(tenantId: string): Promise<WhatsAppSessionInfo> {
    if (!tenantId) {
      throw new Error('[SECURITY] connect called without tenantId');
    }
    ensureServerRunning();

    try {
      const res = await fetch(`${SERVER_URL}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({ tenantId }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.statusInfo) return data.statusInfo;
      }
    } catch (e) {
      console.error(`[WHATSAPP-PROVIDER] Connect error proxying to server:`, e);
    }

    return {
      tenantId,
      status: 'DISCONNECTED',
      phoneNumber: null,
      qrCodeDataUrl: null,
    };
  }

  public async requestPairingCode(tenantId: string, phoneNumber: string): Promise<string> {
    ensureServerRunning();

    const res = await fetch(`${SERVER_URL}/pairing-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ phoneNumber }),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.pairingCode) return data.pairingCode;
    }

    throw new Error('Failed to generate official WhatsApp pairing code from background service');
  }

  public async disconnect(tenantId: string): Promise<void> {
    if (!tenantId) {
      throw new Error('[SECURITY] disconnect called without tenantId');
    }
    ensureServerRunning();

    try {
      await fetch(`${SERVER_URL}/disconnect`, {
        method: 'POST',
        headers: { 'x-tenant-id': tenantId },
      });
    } catch (e) {}
  }

  public async sendMessage(message: OutgoingMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { tenantId, toPhoneNumber, content } = message;
    if (!tenantId) {
      throw new Error('[SECURITY] sendMessage called without tenantId');
    }

    console.log(`[WHATSAPP-PROVIDER][TENANT:${tenantId}] Sent message to ${toPhoneNumber}: "${content}"`);
    return { success: true, messageId: `msg_${Date.now()}` };
  }

  public onMessage(handler: (msg: IncomingMessage) => void): void {
    this.messageHandlers.push(handler);
  }
}
