import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Read recipient and CC emails from environment variables (.env / .env.local)
    const toEmail = process.env.ENQUIRY_TO_EMAIL || 'arivuchezhiyan000@gmail.com';
    const ccEmails = process.env.ENQUIRY_CC_EMAILS || 'kavinsoorya2470049@ssn.edu.in,ashwathram2470063@ssn.edu.in,naveenkumar2470051@ssn.edu.in';
    const appscriptUrl = process.env.APPSCRIPT_WEBAPP_URL || process.env.NEXT_PUBLIC_APPSCRIPT_URL;

    const payload = {
      ...body,
      toEmail,
      ccEmails,
      submittedAt: new Date().toISOString(),
    };

    console.log('[Enquiry API] Received submission:', {
      name: body.Fullname || body.name,
      to: toEmail,
      cc: ccEmails,
      hasAppsScriptUrl: Boolean(appscriptUrl),
    });

    // If Google Apps Script Web App URL is provided in .env, forward the request
    if (appscriptUrl && appscriptUrl.startsWith('http')) {
      try {
        const response = await fetch(appscriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const resData = await response.text();
        console.log('[Enquiry API] Apps Script response:', resData);
      } catch (scriptErr) {
        console.error('[Enquiry API] Failed to forward to Apps Script:', scriptErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Enquiry received successfully and dispatched.',
      to: toEmail,
      cc: ccEmails,
    });
  } catch (error) {
    console.error('[Enquiry API Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error processing enquiry' },
      { status: 500 }
    );
  }
}
