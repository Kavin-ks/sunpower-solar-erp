/**
 * =========================================================================
 * SUNPOWER SOLAR ERP — GOOGLE APPS SCRIPT
 * Authentication OTP Dispatcher & Solar Enquiry Mailer
 * =========================================================================
 * 
 * Capabilities:
 * 1. action: "SEND_OTP"   -> Generates 6-digit OTP, caches it for 10 minutes,
 *                            and sends a professional HTML email to the user.
 * 2. action: "VERIFY_OTP" -> Verifies the submitted OTP against the cache.
 * 3. Default (Enquiries)  -> Emails new rooftop solar enquiry notifications to team.
 * 
 * Deployment Instructions:
 * 1. Open Google Apps Script (https://script.google.com).
 * 2. Paste this entire code into Code.gs.
 * 3. Click "Deploy" -> "New deployment".
 * 4. Select type: "Web app".
 * 5. Description: "SunPower Auth OTP & Enquiry WebApp".
 * 6. Execute as: "Me (your email)".
 * 7. Who has access: "Anyone".
 * 8. Click "Deploy" and copy the Web App URL.
 */

var SCRIPT_CACHE_MINUTES = 10; // OTP valid for 10 minutes
var DEFAULT_TO_EMAIL = "arivuchezhiyan000@gmail.com";
var DEFAULT_CC_EMAILS = "kavinsoorya2470049@ssn.edu.in,ashwathram2470063@ssn.edu.in,naveenkumar2470051@ssn.edu.in";

/**
 * Handle GET request (Health Check)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "SunPower Solar ERP Auth & Enquiry API",
    actionsSupported: ["SEND_OTP", "VERIFY_OTP", "ENQUIRY"],
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST request
 */
function doPost(e) {
  try {
    var data = {};

    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var action = (data.action || "").toUpperCase();

    // -------------------------------------------------------------
    // 1. ACTION: SEND_OTP
    // -------------------------------------------------------------
    if (action === "SEND_OTP") {
      var recipientEmail = (data.email || "").trim().toLowerCase();
      var recipientName = data.name || data.Fullname || "Valued User";

      if (!recipientEmail || recipientEmail.indexOf("@") === -1) {
        return respondJSON({ success: false, message: "Valid email address is required to dispatch OTP." });
      }

      // Generate secure 6-digit numeric OTP
      var otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Store in Google Apps Script Cache with 10-minute TTL
      var cache = CacheService.getScriptCache();
      cache.put("OTP_" + recipientEmail, otpCode, SCRIPT_CACHE_MINUTES * 60);

      // Send formatted HTML Email
      var emailSubject = "Your SunPower Solar ERP Verification Code: " + otpCode;
      var htmlBody = buildOtpEmailHtml(recipientName, otpCode, SCRIPT_CACHE_MINUTES);

      MailApp.sendEmail({
        to: recipientEmail,
        subject: emailSubject,
        htmlBody: htmlBody
      });

      return respondJSON({
        success: true,
        status: "success",
        action: "SEND_OTP",
        message: "OTP sent successfully to " + recipientEmail,
        expiresInMinutes: SCRIPT_CACHE_MINUTES
      });
    }

    // -------------------------------------------------------------
    // 2. ACTION: VERIFY_OTP
    // -------------------------------------------------------------
    if (action === "VERIFY_OTP") {
      var recipientEmail = (data.email || "").trim().toLowerCase();
      var submittedOtp = (data.otp || "").toString().trim();

      if (!recipientEmail || !submittedOtp) {
        return respondJSON({ success: false, message: "Both email and OTP are required for verification." });
      }

      var cache = CacheService.getScriptCache();
      var cachedOtp = cache.get("OTP_" + recipientEmail);

      if (!cachedOtp) {
        return respondJSON({
          success: false,
          verified: false,
          message: "OTP has expired or was not requested. Please request a new code."
        });
      }

      if (cachedOtp === submittedOtp) {
        // Clear used OTP to prevent replay
        cache.remove("OTP_" + recipientEmail);
        return respondJSON({
          success: true,
          verified: true,
          message: "Email address verified successfully!"
        });
      } else {
        return respondJSON({
          success: false,
          verified: false,
          message: "Invalid OTP code. Please check your email and try again."
        });
      }
    }

    // -------------------------------------------------------------
    // 3. DEFAULT: SOLAR WEB ENQUIRY NOTIFICATION
    // -------------------------------------------------------------
    var fullName = data.Fullname || data.fullname || data.name || "Anonymous Customer";
    var email = data.email || "Not Provided";
    var phone = data.phone || "Not Provided";
    var solarSystem = data.solarSystem || data.capacity || "Not Specified";
    var systemType = data.systemType || "On-Grid";
    var address = data.address || "Not Provided";
    var city = data.city || "Not Provided";
    var state = data.state || "Tamil Nadu";
    var pincode = data.pincode || "Not Provided";
    var subsidyRequired = data.subsidyRequired ? "Yes (PM Surya Ghar Scheme)" : "No";
    var message = data.message || "None provided";

    var toEmail = data.toEmail || DEFAULT_TO_EMAIL;
    var ccEmails = data.ccEmails || DEFAULT_CC_EMAILS;

    var enquirySubject = "New Solar Rooftop Enquiry from " + fullName + " (" + solarSystem + " " + systemType + ")";
    var enquiryHtml = buildEnquiryEmailHtml({
      fullName: fullName,
      email: email,
      phone: phone,
      solarSystem: solarSystem,
      systemType: systemType,
      address: address,
      city: city,
      state: state,
      pincode: pincode,
      subsidyRequired: subsidyRequired,
      message: message
    });

    MailApp.sendEmail({
      to: toEmail,
      cc: ccEmails,
      subject: enquirySubject,
      htmlBody: enquiryHtml
    });

    return respondJSON({
      status: "success",
      success: true,
      message: "Enquiry successfully emailed to " + toEmail,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return respondJSON({
      status: "error",
      success: false,
      message: err.toString()
    });
  }
}

/**
 * Helper to build JSON responses with CORS headers
 */
function respondJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Email Template: Professional Verification OTP
 */
function buildOtpEmailHtml(name, otp, minutes) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <div style="background-color: #141422; padding: 24px; text-align: center; border-bottom: 3px solid #e63a27;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.05em; font-weight: 800;">SUNPOWER SOLAR ERP</h1>
        <p style="color: #94a3b8; margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Customer Account Security Verification</p>
      </div>
      <div style="padding: 32px 28px;">
        <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Email Verification Code</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">Thank you for registering with SunPower Solar ERP. Please use the following 6-digit verification code to complete your account setup:</p>
        
        <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 0.25em; color: #e63a27; font-family: 'Consolas', 'Monaco', monospace;">${otp}</div>
          <div style="color: #64748b; font-size: 12px; margin-top: 8px; text-transform: uppercase; font-weight: 600;">Valid for ${minutes} minutes</div>
        </div>

        <p style="color: #64748b; font-size: 13.5px; line-height: 1.5;">If you did not request this verification code, please ignore this email or contact our support team immediately.</p>
        
        <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; text-align: center;">
          SunPower Solutions • Geethanjali College of Engineering, Hyderabad<br/>
          Priority Desk: +91 7010818264 • Odoo@gmail.com
        </div>
      </div>
    </div>
  `;
}

/**
 * Email Template: Solar Rooftop Enquiry Notification
 */
function buildEnquiryEmailHtml(e) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background: #141422; color: #fff; padding: 18px 20px; border-bottom: 3px solid #e63a27;">
        <h2 style="margin: 0; font-size: 18px;">☀️ New Solar Rooftop Enquiry</h2>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">SunPower Solar ERP Omnichannel Intake</div>
      </div>
      <div style="padding: 20px; color: #334155; font-size: 14px; line-height: 1.6;">
        <p><strong>Customer Name:</strong> ${e.fullName}</p>
        <p><strong>Email Address:</strong> ${e.email}</p>
        <p><strong>Mobile Phone:</strong> ${e.phone}</p>
        <p><strong>Solar System Capacity:</strong> ${e.solarSystem}</p>
        <p><strong>System Configuration:</strong> ${e.systemType}</p>
        <p><strong>Site Address:</strong> ${e.address}, ${e.city}, ${e.state} - ${e.pincode}</p>
        <p><strong>Subsidy Application:</strong> ${e.subsidyRequired}</p>
        <p><strong>Requirements / Remarks:</strong> ${e.message}</p>
      </div>
    </div>
  `;
}
