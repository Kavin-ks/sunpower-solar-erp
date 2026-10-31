import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Map fields to Spring Boot backend PublicEnquiryRequest
    const fullName = (body.Fullname || body.fullName || body.name || '').trim();
    const phone = (body.phone || '').trim();
    const email = (body.email || '').trim() || null;
    const address = (body.address || body.siteAddress || body.message || 'Installation Site Address').trim();
    const city = (body.city || 'Chennai').trim();
    const state = (body.state || 'Tamil Nadu').trim();
    const pincode = (body.pincode || '600001').trim();

    // Parse requested capacity from dropdown string (e.g. "3kW", "3 kW Solar System", 3)
    let capacity = 3.0;
    if (body.solarSystem) {
      const match = String(body.solarSystem).match(/(\d+(\.\d+)?)/);
      if (match) {
        capacity = parseFloat(match[1]);
      }
    } else if (body.requestedCapacityKw) {
      capacity = parseFloat(String(body.requestedCapacityKw));
    }
    // Clamp to allowed range (1 kW to 5 kW)
    if (isNaN(capacity) || capacity < 1.0) capacity = 1.0;
    if (capacity > 5.0) capacity = 5.0;

    // Determine system type: ON_GRID or OFF_GRID
    const rawType = String(body.systemType || '').toUpperCase();
    const systemType = rawType.includes('OFF') ? 'OFF_GRID' : 'ON_GRID';

    const subsidyRequired = body.subsidyRequired !== undefined ? Boolean(body.subsidyRequired) : true;
    const monthlyElectricityBill = body.monthlyElectricityBill ? Number(body.monthlyElectricityBill) : null;
    const notes = (body.notes || body.message || '').trim();

    const backendPayload = {
      fullName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      requestedCapacityKw: capacity,
      systemType,
      subsidyRequired,
      monthlyElectricityBill,
      notes,
      source: 'CUSTOMER_PORTAL',
    };

    console.log('[Customer Portal] Forwarding enquiry to SunPower Backend:', {
      fullName,
      phone,
      capacity,
      systemType,
    });

    // 2. Dispatch to central Spring Boot Backend
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8080';
    let backendData: any = null;

    try {
      const backendRes = await fetch(`${backendUrl}/api/public/v1/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload),
      });

      backendData = await backendRes.json();

      if (!backendRes.ok || !backendData.success) {
        console.error('[Customer Portal] Backend returned error:', backendData);
        return NextResponse.json(
          {
            success: false,
            message: backendData?.message || backendData?.error || 'Validation error from central database.',
            validationErrors: backendData?.validationErrors,
          },
          { status: backendRes.status }
        );
      }
    } catch (netErr: any) {
      console.error('[Customer Portal] Failed to reach central backend:', netErr);
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to reach SunPower central database. Please ensure backend service is running on port 8080.',
        },
        { status: 503 }
      );
    }

    // 3. Optional: asynchronous email / Google Apps Script notification (non-blocking)
    const appscriptUrl = process.env.APPSCRIPT_WEBAPP_URL || process.env.NEXT_PUBLIC_APPSCRIPT_URL;
    if (appscriptUrl && appscriptUrl.startsWith('http')) {
      const toEmail = process.env.ENQUIRY_TO_EMAIL || 'arivuchezhiyan000@gmail.com';
      const ccEmails = process.env.ENQUIRY_CC_EMAILS || '';
      fetch(appscriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...backendPayload,
          enquiryNumber: backendData.enquiryNumber,
          toEmail,
          ccEmails,
          submittedAt: new Date().toISOString(),
        }),
        redirect: 'follow',
      }).catch((e) => console.warn('[Customer Portal] Apps Script notification warning:', e.message));
    }

    // 4. Return clean, secure response with the generated enquiryNumber to the customer portal
    return NextResponse.json({
      success: true,
      enquiryNumber: backendData.enquiryNumber,
      message: backendData.message || `Your enquiry (${backendData.enquiryNumber}) has been registered with SunPower Sales!`,
      submissionTime: backendData.submissionTime,
    });
  } catch (error: any) {
    console.error('[Customer Portal API Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Internal error processing enquiry: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
