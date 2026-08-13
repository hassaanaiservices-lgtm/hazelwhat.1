import { NextResponse } from 'next/server';
import { getCustomerById, createChatMessage } from '@/lib/db';
import { whatsAppService } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'tenant-salon-alpha-1234';
    const body = await request.json();
    const { customerId, content } = body;

    if (!customerId || !content || content.trim() === '') {
      return NextResponse.json({ error: 'customerId and non-empty content are required' }, { status: 400 });
    }

    // 1. Verify customer belongs to this tenant
    const customer = await getCustomerById(tenantId, customerId);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found for this tenant' }, { status: 404 });
    }

    const recipientPhone = customer.phone_number || '+1-555-0188';

    // 2. Deliver message via Phase 5 WhatsApp module
    const sendResult = await whatsAppService.sendMessage({
      tenantId: tenantId,
      toPhoneNumber: recipientPhone,
      content,
    });

    if (!sendResult.success) {
      console.warn(`[CHAT INBOX] WhatsApp delivery returned status: ${sendResult.error}`);
    }

    // 3. Save message in DB explicitly tagged as 'business' (human-sent)
    const chatMessage = await createChatMessage(tenantId, {
      customer_id: customerId,
      sender_type: 'business',
      content,
      message_id: sendResult.messageId || `human_msg_${Date.now()}`,
    });

    return NextResponse.json({ success: true, message: chatMessage, whatsappResult: sendResult });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send human reply' }, { status: 500 });
  }
}
