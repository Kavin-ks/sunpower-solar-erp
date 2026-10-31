import { NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:8080';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const customerPhone = (body.customerPhone || body.phone || '').trim();
    const customerName = (body.customerName || body.name || '').trim();
    const customerEmail = (body.customerEmail || body.email || '').trim() || null;
    const serialCode = (body.serialCode || body.serialNumber || '').trim();
    const faultCategory = (body.faultCategory || body.category || 'General Defect').trim();
    const complaintDescription = (body.complaintDescription || body.description || '').trim();
    const complaintPhotoUrl = body.complaintPhotoUrl || null;

    if (!customerPhone) {
      return NextResponse.json({ error: 'Customer phone number is required' }, { status: 400 });
    }
    if (!serialCode) {
      return NextResponse.json({ error: 'Equipment serial number is required' }, { status: 400 });
    }
    if (!complaintDescription) {
      return NextResponse.json({ error: 'Complaint description is required' }, { status: 400 });
    }

    const backendPayload = {
      customerPhone,
      customerName,
      customerEmail,
      serialCode,
      faultCategory,
      complaintDescription,
      complaintPhotoUrl,
    };

    const res = await fetch(`${BACKEND_BASE_URL}/api/service-tickets/public/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendPayload),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to submit complaint' },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Customer complaint proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error while forwarding complaint' },
      { status: 500 }
    );
  }
}
