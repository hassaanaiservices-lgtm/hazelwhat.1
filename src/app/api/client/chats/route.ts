import { NextResponse } from 'next/server';
import { getCustomers, getChatMessages } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'tenant-salon-alpha-1234';

    // 1. Fetch customers for tenant
    const customers = await getCustomers(tenantId);
    
    // 2. Fetch messages for tenant
    const messages = await getChatMessages(tenantId);

    // Group messages by customer
    const conversations = customers.map((customer) => {
      const customerMessages = messages.filter((m) => m.customer_id === customer.id);
      const lastMessage = customerMessages.length > 0 ? customerMessages[customerMessages.length - 1] : null;

      return {
        customer,
        lastMessage,
        messageCount: customerMessages.length,
        messages: customerMessages,
      };
    });

    return NextResponse.json({ conversations, messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch chat conversations' }, { status: 500 });
  }
}
