import { NextResponse } from 'next/server';
import { whatsAppService } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-client-tenant';
    await whatsAppService.disconnect(tenantId);
    return NextResponse.json({ success: true, message: 'WhatsApp session disconnected and purged.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to disconnect WhatsApp' }, { status: 500 });
  }
}
