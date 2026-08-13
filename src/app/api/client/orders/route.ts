import { NextResponse } from 'next/server';
import { getOrders, createOrder, updateOrderStatus } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'tenant-salon-alpha-1234';
    const orders = await getOrders(tenantId);
    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'tenant-salon-alpha-1234';
    const body = await request.json();
    const { customerId, itemsDescription, quantity, totalAmount, notes } = body;

    if (!customerId || totalAmount === undefined) {
      return NextResponse.json({ error: 'customerId and totalAmount are required' }, { status: 400 });
    }

    const order = await createOrder(tenantId, {
      customer_id: customerId,
      items_description: itemsDescription || 'General Product Order',
      quantity: quantity ? Number(quantity) : 1,
      total_amount: Number(totalAmount),
      status: 'New',
      notes: notes || '',
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'tenant-salon-alpha-1234';
    const body = await request.json();
    const { orderId, status, notes } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
    }

    const updatedOrder = await updateOrderStatus(tenantId, orderId, status, notes);
    return NextResponse.json({ order: updatedOrder });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update order status' }, { status: 500 });
  }
}
