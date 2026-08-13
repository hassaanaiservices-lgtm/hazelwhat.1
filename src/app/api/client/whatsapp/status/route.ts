import { NextResponse } from 'next/server';
import { whatsAppService } from '@/lib/whatsapp';

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-client-tenant';
    const statusInfo = await whatsAppService.getStatus(tenantId);
    return NextResponse.json({ statusInfo });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch WhatsApp status' }, { status: 500 });
  }
}
