import { NextResponse } from 'next/server';
import { getAllTenantsForAdmin, createTenant, createTenantConfig, createAdminAuditLog } from '@/lib/db';

export async function GET() {
  try {
    const tenants = await getAllTenantsForAdmin({ isAdmin: true });
    return NextResponse.json({ tenants });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to list tenants' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, defaultAiModel, systemPrompt } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and Slug are required' }, { status: 400 });
    }

    // 1. Create Tenant (creates genuinely empty tenant)
    const newTenant = await createTenant({
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      status: 'active',
      subscription_status: 'trial',
    });

    // 2. Create Default Tenant Config
    await createTenantConfig(newTenant.id, {
      business_name: name,
      settings: {
        ai_provider: 'openai',
        ai_model: defaultAiModel || 'gpt-4o-mini',
        system_prompt: systemPrompt || 'You are an AI assistant for ' + name,
      },
    });

    // 3. Log Admin Action
    await createAdminAuditLog(
      { isAdmin: true },
      {
        action: 'create_client',
        target_tenant_id: newTenant.id,
        details: { name, slug },
      }
    );

    return NextResponse.json({ tenant: newTenant }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create tenant' }, { status: 500 });
  }
}
