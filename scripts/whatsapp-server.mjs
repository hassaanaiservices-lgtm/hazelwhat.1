import http from 'http';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import pino from 'pino';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';

const PORT = process.env.WHATSAPP_SERVER_PORT || 3001;

const sessions = new Map();
const activeSockets = new Map();

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getTenantDir(tenantId) {
  const dir = path.join(process.cwd(), '.whatsapp-sessions', tenantId);
  ensureDir(dir);
  return dir;
}

async function getStatus(tenantId) {
  const activeSock = activeSockets.get(tenantId);
  if (activeSock && activeSock.user) {
    const rawId = activeSock.user.id || '';
    const rawNumber = rawId.split(':')[0] || rawId.split('@')[0] || '';
    const phone = rawNumber ? (rawNumber.startsWith('+') ? rawNumber : '+' + rawNumber) : '+92 300 9876543';
    return { tenantId, status: 'CONNECTED', phoneNumber: phone, qrCodeDataUrl: null };
  }

  const tenantDir = path.join(process.cwd(), '.whatsapp-sessions', tenantId);
  const sessionFile = path.join(tenantDir, 'creds.json');
  if (fs.existsSync(sessionFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      if (data && data.me && data.me.id) {
        const rawJid = data.me.id || '';
        const rawNumber = rawJid.split(':')[0] || rawJid.split('@')[0] || '';
        const phone = rawNumber ? (rawNumber.startsWith('+') ? rawNumber : '+' + rawNumber) : '+92 300 9876543';
        return { tenantId, status: 'CONNECTED', phoneNumber: phone, qrCodeDataUrl: null };
      }
    } catch (e) {}
  }

  const mem = sessions.get(tenantId);
  if (mem) return mem;

  return { tenantId, status: 'DISCONNECTED', phoneNumber: null, qrCodeDataUrl: null };
}

async function connectTenant(tenantId) {
  const status = await getStatus(tenantId);
  if (status.status === 'CONNECTED') return status;

  // 1. Explicitly close any existing socket attempt for tenantId before creating a new one
  if (activeSockets.has(tenantId)) {
    const existingSock = activeSockets.get(tenantId);
    activeSockets.delete(tenantId);
    if (existingSock) {
      console.log(`[STANDALONE-WA-SERVER][TENANT:${tenantId}] Explicitly closing previous socket before reconnecting...`);
      try {
        existingSock.ws?.close();
        existingSock.end?.(new Error('Reconnecting with fresh socket'));
      } catch (e) {}
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const tenantDir = getTenantDir(tenantId);
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState(tenantDir);

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    syncFullHistory: false,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
  });

  activeSockets.set(tenantId, sock);
  sock.ev.on('creds.update', saveCreds);

  return new Promise((resolve) => {
    let resolved = false;

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`[STANDALONE-WA-SERVER][TENANT:${tenantId}] Live QR code generated!`);
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, { margin: 2, width: 280 });
          const sess = { tenantId, status: 'DISCONNECTED', phoneNumber: null, qrCodeDataUrl };
          sessions.set(tenantId, sess);
          if (!resolved) {
            resolved = true;
            resolve(sess);
          }
        } catch (e) {}
      }

      if (connection === 'open') {
        const rawId = sock.user?.id || '';
        const rawNumber = rawId.split(':')[0] || rawId.split('@')[0] || '';
        const phone = rawNumber ? (rawNumber.startsWith('+') ? rawNumber : '+' + rawNumber) : '+92 300 9876543';
        console.log(`[STANDALONE-WA-SERVER][TENANT:${tenantId}] SUCCESS: Connected to WhatsApp for ${phone}!`);
        const sess = { tenantId, status: 'CONNECTED', phoneNumber: phone, qrCodeDataUrl: null };
        sessions.set(tenantId, sess);
        if (!resolved) {
          resolved = true;
          resolve(sess);
        }
      }

      if (connection === 'close') {
        activeSockets.delete(tenantId);
        const code = lastDisconnect?.error?.output?.statusCode;
        console.log(`[STANDALONE-WA-SERVER][TENANT:${tenantId}] Socket closed (code: ${code})`);
        
        // Purge session folder if logged out OR if connection closed prior to full registration
        const isRegistered = sock.authState?.creds?.registered;
        if (code === DisconnectReason.loggedOut || !isRegistered) {
          console.log(`[STANDALONE-WA-SERVER][TENANT:${tenantId}] Purging unauthenticated/corrupted session folder.`);
          sessions.delete(tenantId);
          if (fs.existsSync(tenantDir)) {
            try { fs.rmSync(tenantDir, { recursive: true, force: true }); } catch (e) {}
          }
        }
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(sessions.get(tenantId) || { tenantId, status: 'DISCONNECTED', qrCodeDataUrl: null });
      }
    }, 6000);
  });
}

async function requestPairingCode(tenantId, phoneNumber) {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  let sock = activeSockets.get(tenantId);

  if (!sock) {
    const tenantDir = getTenantDir(tenantId);
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(tenantDir);

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
    });

    activeSockets.set(tenantId, sock);
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      if (update.connection === 'open') {
        const rawId = sock.user?.id || '';
        const rawNumber = rawId.split(':')[0] || rawId.split('@')[0] || cleanPhone;
        const phone = '+' + rawNumber;
        sessions.set(tenantId, { tenantId, status: 'CONNECTED', phoneNumber: phone, qrCodeDataUrl: null });
      }
    });
  }

  if (!sock.authState.creds.registered) {
    const code = await sock.requestPairingCode(cleanPhone);
    return code;
  }
  throw new Error('Device is already registered');
}

async function disconnectTenant(tenantId) {
  const sock = activeSockets.get(tenantId);
  if (sock) {
    try { await sock.logout(); } catch (e) {}
    activeSockets.delete(tenantId);
  }
  sessions.delete(tenantId);
  const tenantDir = path.join(process.cwd(), '.whatsapp-sessions', tenantId);
  if (fs.existsSync(tenantDir)) {
    fs.rmSync(tenantDir, { recursive: true, force: true });
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = new URL(req.url, `http://${req.headers.host}`);
  const tenantId = req.headers['x-tenant-id'] || url.searchParams.get('tenantId') || 'demo-client-tenant';

  if (req.method === 'GET' && url.pathname === '/status') {
    const status = await getStatus(tenantId);
    res.writeHead(200);
    return res.end(JSON.stringify({ statusInfo: status }));
  }

  if (req.method === 'POST' && url.pathname === '/connect') {
    let body = {};
    try {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      body = JSON.parse(Buffer.concat(buffers).toString() || '{}');
    } catch (e) {}

    const status = await connectTenant(tenantId);
    res.writeHead(200);
    return res.end(JSON.stringify({ statusInfo: status }));
  }

  if (req.method === 'POST' && url.pathname === '/pairing-code') {
    try {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const body = JSON.parse(Buffer.concat(buffers).toString() || '{}');
      const code = await requestPairingCode(tenantId, body.phoneNumber);
      res.writeHead(200);
      return res.end(JSON.stringify({ success: true, pairingCode: code }));
    } catch (e) {
      res.writeHead(500);
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  if (req.method === 'POST' && url.pathname === '/disconnect') {
    await disconnectTenant(tenantId);
    res.writeHead(200);
    return res.end(JSON.stringify({ success: true }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`[STANDALONE-WA-SERVER] Listening on http://localhost:${PORT}`);
});
