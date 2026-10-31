import { NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:8080';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticketNumber: string }> }
) {
  try {
    const { ticketNumber } = await params;
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone') || '';

    const res = await fetch(
      `${BACKEND_BASE_URL}/api/service-tickets/public/track/${encodeURIComponent(ticketNumber)}?phone=${encodeURIComponent(phone)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || 'Ticket not found or contact verification failed' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Customer track proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error while tracking complaint' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ticketNumber: string }> }
) {
  try {
    const { ticketNumber } = await params;
    const body = await request.json();

    const res = await fetch(
      `${BACKEND_BASE_URL}/api/service-tickets/public/confirm/${encodeURIComponent(ticketNumber)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationNotes: body.confirmationNotes || 'Customer confirmed satisfactory restoration of solar generation.',
          confirmedByCustomerName: body.confirmedByCustomerName || 'Homeowner (Portal)',
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to record customer confirmation' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Customer confirmation proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error while confirming complaint resolution' },
      { status: 500 }
    );
  }
}
