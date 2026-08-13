import { NextResponse } from 'next/server';
import { getKnowledgeBaseEntries, createKnowledgeBaseEntry } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'tenant-salon-alpha-1234';
    const entries = await getKnowledgeBaseEntries(tenantId);
    return NextResponse.json({ entries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch knowledge base entries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'tenant-salon-alpha-1234';
    const body = await request.json();
    const { entry_type, title, content, price, category, url } = body;

    if (!entry_type || !title || !content) {
      return NextResponse.json({ error: 'entry_type, title, and content are required' }, { status: 400 });
    }

    const metadata: Record<string, any> = {};
    if (price !== undefined && price !== null) metadata.price = Number(price);
    if (category) metadata.category = category;
    if (url) metadata.url = url;

    const result = await createKnowledgeBaseEntry(tenantId, {
      entry_type,
      title,
      content,
      metadata,
    });

    if (result.isDuplicate) {
      return NextResponse.json(
        { error: 'Duplicate content already exists in knowledge base for this tenant.', isDuplicate: true },
        { status: 409 }
      );
    }

    return NextResponse.json({ entry: result.entry }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create knowledge base entry' }, { status: 500 });
  }
}
