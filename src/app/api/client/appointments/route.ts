import { NextResponse } from 'next/server';
import { getAppointments, createAppointment, updateAppointmentStatus } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'tenant-salon-alpha-1234';
    const appointments = await getAppointments(tenantId);
    return NextResponse.json({ appointments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'tenant-salon-alpha-1234';
    const body = await request.json();
    const { customerId, service, scheduledAt, notes } = body;

    if (!customerId || !scheduledAt) {
      return NextResponse.json({ error: 'customerId and scheduledAt date/time are required' }, { status: 400 });
    }

    const appointment = await createAppointment(tenantId, {
      customer_id: customerId,
      service: service || 'General Service',
      scheduled_at: scheduledAt,
      status: 'Pending',
      notes: notes || '',
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to book appointment' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'tenant-salon-alpha-1234';
    const body = await request.json();
    const { appointmentId, status, notes } = body;

    if (!appointmentId || !status) {
      return NextResponse.json({ error: 'appointmentId and status are required' }, { status: 400 });
    }

    const updatedAppointment = await updateAppointmentStatus(tenantId, appointmentId, status, notes);
    return NextResponse.json({ appointment: updatedAppointment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update appointment status' }, { status: 500 });
  }
}
