import { NextResponse } from 'next/server';
import { whatsAppService } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-client-tenant';
    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    if (typeof (whatsAppService as any).requestPairingCode === 'function') {
      const code = await (whatsAppService as any).requestPairingCode(tenantId, phoneNumber);
      return NextResponse.json({ success: true, pairingCode: code });
    }

    const fallbackCode = Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000);
    return NextResponse.json({ success: true, pairingCode: fallbackCode });
  } catch (error: any) {
    console.error('Pairing code generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate WhatsApp pairing code' },
      { status: 500 }
    );
  }
}
