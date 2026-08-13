import { NextResponse } from 'next/server';
import { getTenantById, updateTenant, getTenantConfig, updateTenantConfig, createAdminAuditLog, deleteTenant } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await getTenantById(id);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    const config = await getTenantConfig(id);
    return NextResponse.json({ tenant, config });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch tenant' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      status,
      subscription_status,
      installation_fee,
      monthly_fee,
      currency,
      client_username,
      client_password,
      ai_model,
      system_prompt,
    } = body;

    const tenantUpdates: Record<string, any> = {};
    if (name !== undefined) tenantUpdates.name = name;
    if (status !== undefined) tenantUpdates.status = status;
    if (subscription_status !== undefined) tenantUpdates.subscription_status = subscription_status;
    if (installation_fee !== undefined) tenantUpdates.installation_fee = Number(installation_fee);
    if (monthly_fee !== undefined) tenantUpdates.monthly_fee = Number(monthly_fee);
    if (currency !== undefined) tenantUpdates.currency = currency;
    if (client_username !== undefined) tenantUpdates.client_username = client_username;
    if (client_password !== undefined) tenantUpdates.client_password = client_password;

    let updatedTenant = null;
    if (Object.keys(tenantUpdates).length > 0) {
      updatedTenant = await updateTenant(id, tenantUpdates);
    }

    if (ai_model !== undefined || system_prompt !== undefined) {
      const currentConfig = await getTenantConfig(id);
      const currentSettings = currentConfig?.settings || {};
      await updateTenantConfig(id, {
        business_name: name || currentConfig?.business_name || 'Business',
        settings: {
          ...currentSettings,
          ...(ai_model !== undefined && { ai_model }),
          ...(system_prompt !== undefined && { system_prompt }),
        },
      });
    }

    // Log action
    await createAdminAuditLog(
      { isAdmin: true },
      {
        action: 'update_client',
        target_tenant_id: id,
        details: body,
      }
    );

    return NextResponse.json({ success: true, tenant: updatedTenant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update tenant' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteTenant(id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 400 });
    }

    await createAdminAuditLog(
      { isAdmin: true },
      {
        action: 'delete_client',
        target_tenant_id: id,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete tenant' }, { status: 500 });
  }
}
