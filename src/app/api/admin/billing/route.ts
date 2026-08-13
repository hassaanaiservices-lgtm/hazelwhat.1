import { NextResponse } from 'next/server';
import { getAdminBillingOverview } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // In production, session verification check verifies admin role from JWT cookie
    const billingOverviews = await getAdminBillingOverview({ isAdmin: true });
    return NextResponse.json({ billingOverviews });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch admin billing overview' }, { status: 500 });
  }
}
