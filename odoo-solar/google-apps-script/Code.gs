/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: Solar Web Enquiry Email Dispatcher
 * =========================================================================
 * 
 * Features:
 * 1. Receives form submissions from the Solar Web enquiry form.
 * 2. Sends formatted HTML email to TO and CC recipients.
 * 3. Dynamically respects TO and CC email addresses sent from your .env file,
 *    meaning you NEVER have to re-deploy or change this script when updating emails!
 * 4. Fallback defaults:
 *    - TO: arivuchezhiyan000@gmail.com
 *    - CC: kavinsoorya2470049@ssn.edu.in, ashwathram2470063@ssn.edu.in, naveenkumar2470051@ssn.edu.in
 * 5. Logs submissions to Google Sheet if attached.
 */

// Default fallbacks if not supplied in .env
var DEFAULT_TO_EMAIL = "arivuchezhiyan000@gmail.com";
var DEFAULT_CC_EMAILS = "kavinsoorya2470049@ssn.edu.in,ashwathram2470063@ssn.edu.in,naveenkumar2470051@ssn.edu.in";

/**
 * Handle GET request (Health Check)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Solar Web Enquiry Apps Script is active and ready to receive POST submissions.",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST request (Form Submission)
 */
function doPost(e) {
  try {
    var data = {};

    // 1. Parse incoming payload (JSON or Form URL-encoded)
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // Extract form fields
    var fullName = data.Fullname || data.fullname || data.name || "Anonymous Customer";
    var email = data.email || "Not Provided";
    var phone = data.phone || "Not Provided";
    var solarSystem = data.solarSystem || data.capacity || "Not Specified";
    var systemType = data.systemType || "On-Grid";
    var message = data.message || data.questions || data.sources || "None provided";

    // 2. Read TO and CC from .env payload, or Script Properties, or fallback defaults
    var toEmail = data.toEmail || data.to || getScriptProp("TO_EMAIL") || DEFAULT_TO_EMAIL;
    var ccEmails = data.ccEmails || data.cc || getScriptProp("CC_EMAILS") || DEFAULT_CC_EMAILS;

    // 3. Construct Email Subject
    var subject = "⚡ New Solar Enquiry: " + fullName + " [" + solarSystem + " " + systemType + "]";

    // 4. Construct Responsive HTML Email Template
    var htmlBody = ""
      + "<div style='font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;'>"
      + "  <div style='background: #19142d; padding: 25px; text-align: center; color: #ffffff;'>"
      + "    <h2 style='margin: 0; font-size: 22px; color: #ffffff; font-weight: bold;'>Odoo Solar Power Company</h2>"
      + "    <p style='margin: 6px 0 0; color: #f59e0b; font-size: 14px; font-weight: 600;'>New Solar Site Survey & Package Enquiry</p>"
      + "  </div>"
      + "  <div style='padding: 25px; background: #ffffff;'>"
      + "    <p style='font-size: 15px; color: #334155;'>A new customer has submitted an enquiry form on the website. Below are the full details:</p>"
      + "    <table style='width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;'>"
      + "      <tr style='background: #f8fafc;'>"
      + "        <td style='padding: 12px 15px; font-weight: bold; color: #475569; width: 35%; border: 1px solid #e2e8f0;'>Customer Name</td>"
      + "        <td style='padding: 12px 15px; color: #0f172a; font-weight: 600; border: 1px solid #e2e8f0;'>" + escapeHtml(fullName) + "</td>"
      + "      </tr>"
      + "      <tr>"
      + "        <td style='padding: 12px 15px; font-weight: bold; color: #475569; border: 1px solid #e2e8f0;'>Email Address</td>"
      + "        <td style='padding: 12px 15px; border: 1px solid #e2e8f0;'><a href='mailto:" + escapeHtml(email) + "' style='color: #0284c7; text-decoration: none; font-weight: 600;'>" + escapeHtml(email) + "</a></td>"
      + "      </tr>"
      + "      <tr style='background: #f8fafc;'>"
      + "        <td style='padding: 12px 15px; font-weight: bold; color: #475569; border: 1px solid #e2e8f0;'>Phone Number</td>"
      + "        <td style='padding: 12px 15px; border: 1px solid #e2e8f0;'><a href='tel:" + escapeHtml(phone) + "' style='color: #10b981; font-weight: bold; text-decoration: none;'>" + escapeHtml(phone) + "</a></td>"
      + "      </tr>"
      + "      <tr>"
      + "        <td style='padding: 12px 15px; font-weight: bold; color: #475569; border: 1px solid #e2e8f0;'>Solar System Capacity</td>"
      + "        <td style='padding: 12px 15px; color: #e63a27; font-weight: bold; border: 1px solid #e2e8f0;'>" + escapeHtml(solarSystem) + "</td>"
      + "      </tr>"
      + "      <tr style='background: #f8fafc;'>"
      + "        <td style='padding: 12px 15px; font-weight: bold; color: #475569; border: 1px solid #e2e8f0;'>System Type</td>"
      + "        <td style='padding: 12px 15px; color: #0f172a; font-weight: 600; border: 1px solid #e2e8f0;'>" + escapeHtml(systemType) + "</td>"
      + "      </tr>"
      + "      <tr>"
      + "        <td style='padding: 12px 15px; font-weight: bold; color: #475569; border: 1px solid #e2e8f0;'>Available Area & Questions</td>"
      + "        <td style='padding: 12px 15px; color: #334155; line-height: 1.5; border: 1px solid #e2e8f0;'>" + escapeHtml(message).replace(/\n/g, '<br/>') + "</td>"
      + "      </tr>"
      + "      <tr style='background: #f8fafc;'>"
      + "        <td style='padding: 12px 15px; font-weight: bold; color: #475569; border: 1px solid #e2e8f0;'>Submitted At</td>"
      + "        <td style='padding: 12px 15px; color: #64748b; font-size: 13px; border: 1px solid #e2e8f0;'>" + Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss") + " IST</td>"
      + "      </tr>"
      + "    </table>"
      + "    <div style='margin-top: 25px; padding: 15px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; color: #166534; font-size: 13px;'>"
      + "      ✓ <strong>Action Required:</strong> Contact customer within 24 hours to schedule rooftop shadow-free survey & estimate subsidy."
      + "    </div>"
      + "  </div>"
      + "  <div style='background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 15px 25px; font-size: 12px; color: #94a3b8; text-align: center;'>"
      + "    Automated Solar Web CRM Notification &bull; Odoo Solar System, Geethanjali College of Engineering, Hyderabad"
      + "  </div>"
      + "</div>";

    // 5. Send Email via MailApp
    MailApp.sendEmail({
      to: toEmail,
      cc: ccEmails,
      subject: subject,
      htmlBody: htmlBody,
      replyTo: email
    });

    // 6. Optional: Append row to Google Sheet if active sheet exists
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss) {
        var sheet = ss.getActiveSheet();
        sheet.appendRow([
          new Date(),
          fullName,
          email,
          phone,
          solarSystem,
          systemType,
          message,
          "New Enquiry",
          toEmail,
          ccEmails
        ]);
      }
    } catch (sheetErr) {
      // Continue even if sheet not attached
    }

    // 7. Return JSON Success Response with CORS headers
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Enquiry successfully emailed to " + toEmail + " with CC to " + ccEmails,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper to escape HTML characters
 */
function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Helper to get script property
 */
function getScriptProp(key) {
  try {
    return PropertiesService.getScriptProperties().getProperty(key);
  } catch (e) {
    return null;
  }
}
