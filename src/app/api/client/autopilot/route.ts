import { NextResponse } from 'next/server';
import { getTenantConfig, updateTenantConfig, updateCustomerAutopilotState } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'tenant-salon-alpha-1234';
    const config = await getTenantConfig(tenantId);
    const isGlobalAutopilotOn = config?.settings?.autopilot_enabled !== false;
    return NextResponse.json({ isGlobalAutopilotOn, settings: config?.settings || {} });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch autopilot settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'tenant-salon-alpha-1234';
    const body = await request.json();
    const { action, customerId, globalAutopilotEnabled, isHumanHandled } = body;

    // Action 1: Toggle Global Tenant-wide Autopilot Switch
    if (action === 'toggle_global') {
      const config = await getTenantConfig(tenantId);
      const currentSettings = config?.settings || {};
      const updatedConfig = await updateTenantConfig(tenantId, {
        business_name: config?.business_name || 'Business',
        settings: {
          ...currentSettings,
          autopilot_enabled: Boolean(globalAutopilotEnabled),
        },
      });
      return NextResponse.json({ success: true, config: updatedConfig });
    }

    // Action 2: Toggle Per-Conversation Copilot Override
    if (action === 'toggle_conversation' && customerId) {
      const updatedCustomer = await updateCustomerAutopilotState(tenantId, customerId, {
        is_human_handled: Boolean(isHumanHandled),
        needs_human_attention: Boolean(isHumanHandled), // Clear needs_human if resuming AI
      });
      return NextResponse.json({ success: true, customer: updatedCustomer });
    }

    return NextResponse.json({ error: 'Invalid action payload' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update autopilot state' }, { status: 500 });
  }
}
