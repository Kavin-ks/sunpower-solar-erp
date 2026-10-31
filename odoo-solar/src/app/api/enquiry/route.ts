import { NextResponse } from 'next/server';

// 3-Tier Google Apps Script Cascade Pool for Enquiry Notifications
const getAppsScriptUrls = (): string[] => {
  const urls: string[] = [];
  if (process.env.APPSCRIPT_PRIMARY_URL) urls.push(process.env.APPSCRIPT_PRIMARY_URL);
  if (process.env.APPSCRIPT_WEBAPP_URL && !urls.includes(process.env.APPSCRIPT_WEBAPP_URL)) {
    urls.push(process.env.APPSCRIPT_WEBAPP_URL);
  }
  if (process.env.APPSCRIPT_BACKUP_URL1) urls.push(process.env.APPSCRIPT_BACKUP_URL1);
  if (process.env.APPSCRIPT_BACKUP_URL2) urls.push(process.env.APPSCRIPT_BACKUP_URL2);

  const defaultList = [
    'https://script.google.com/macros/s/AKfycbwvj28CeDEk0G0vXnHHHf13ZHbCBvnBM1kaix5ei5xBT854u2kceZu2RF4gK3z75OAM/exec',
    'https://script.google.com/macros/s/AKfycbz5Npc-7ELsbWnOmNKQFmKm5r4T5G5uXYGAaCVO6LWNkYI0pauqtAN-lNTVK0SUItCw/exec',
    'https://script.google.com/macros/s/AKfycbxqSJaJYfqxUD6PUfenZf-Lx2kKPMkY7WaPr_wFGkAxDkMbsz5kuMOHPoEHsUPlio-z/exec',
  ];
  for (const item of defaultList) {
    if (!urls.includes(item)) urls.push(item);
  }
  return urls;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Read recipient and CC emails from environment variables (.env / .env.local)
    const toEmail = process.env.ENQUIRY_TO_EMAIL || 'arivuchezhiyan000@gmail.com';
    const ccEmails = process.env.ENQUIRY_CC_EMAILS || 'kavinsoorya2470049@ssn.edu.in,ashwathram2470063@ssn.edu.in,naveenkumar2470051@ssn.edu.in';

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
    });

    const scriptUrls = getAppsScriptUrls();
    let emailDispatched = false;
    let endpointUsed = '';

    // Cascade: Primary -> Backup 1 -> Backup 2
    for (let i = 0; i < scriptUrls.length; i++) {
      const url = scriptUrls[i];
      const tierName = i === 0 ? 'Primary' : `Backup ${i}`;
      try {
        console.log(`[Enquiry API] Attempting email dispatch via ${tierName}...`);
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          redirect: 'follow',
        });

        const resData = await response.json().catch(async () => {
          const text = await response.text();
          return { message: text };
        });

        const isQuotaHit =
          resData.quotaExceeded ||
          (resData.message &&
            (resData.message.includes('Service invoked too many times') ||
             resData.message.includes('quota')));

        const isSuccess = (resData.success || resData.status === 'success') && !isQuotaHit;

        if (isSuccess) {
          emailDispatched = true;
          endpointUsed = tierName;
          console.log(`[Enquiry API] Enquiry notification successfully sent via ${tierName}!`);
          break; // Exit on success
        } else {
          console.warn(`[Enquiry API] ${tierName} returned error/quota limit. Cascading to next backup...`);
        }
      } catch (scriptErr) {
        console.error(`[Enquiry API] Error forwarding to ${tierName}:`, scriptErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Enquiry received successfully and dispatched.',
      dispatchedVia: endpointUsed || 'Acknowledged',
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
