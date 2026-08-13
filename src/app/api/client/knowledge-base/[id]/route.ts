import { NextResponse } from 'next/server';
import { updateKnowledgeBaseEntry, deleteKnowledgeBaseEntry } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id') || 'tenant-salon-alpha-1234';
    const body = await request.json();
    const { title, content, price, category } = body;

    const metadataUpdates: Record<string, any> = {};
    if (price !== undefined) metadataUpdates.price = Number(price);
    if (category !== undefined) metadataUpdates.category = category;

    const updated = await updateKnowledgeBaseEntry(tenantId, id, {
      title,
      content,
      metadata: Object.keys(metadataUpdates).length > 0 ? metadataUpdates : undefined,
    });

    return NextResponse.json({ entry: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update entry' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id') || 'tenant-salon-alpha-1234';
    const success = await deleteKnowledgeBaseEntry(tenantId, id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete entry' }, { status: 500 });
  }
}
