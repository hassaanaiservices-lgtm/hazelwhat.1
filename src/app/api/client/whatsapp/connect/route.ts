import { NextResponse } from 'next/server';
import { whatsAppService } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-client-tenant';
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {}

    if (body && body.authenticate) {
      const statusInfo = await (whatsAppService as any).authenticateSession(tenantId, body.phoneNumber);
      return NextResponse.json({ statusInfo });
    }

    const statusInfo = await whatsAppService.connect(tenantId);
    return NextResponse.json({ statusInfo });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to initiate WhatsApp connection' }, { status: 500 });
  }
}
