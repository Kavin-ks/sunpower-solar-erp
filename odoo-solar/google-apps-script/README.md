# Google Apps Script Setup Guide (Solar Web Enquiry Dispatcher)

This Google Apps Script automatically receives website enquiries and sends a styled HTML email to:
- **TO:** `arivuchezhiyan000@gmail.com`
- **CC:** `kavinsoorya2470049@ssn.edu.in, ashwathram2470063@ssn.edu.in, naveenkumar2470051@ssn.edu.in`

### 💡 Zero Code Maintenance (Dynamic .env Integration)
The script dynamically accepts the `toEmail` and `ccEmails` sent from your Next.js project's `.env` file (`ENQUIRY_TO_EMAIL` and `ENQUIRY_CC_EMAILS`).  
**If you ever need to change or add email addresses in the future, you only need to change them in your `.env` file! You DO NOT need to touch or re-deploy the Google Apps Script code.**

---

## 🚀 2-Minute Deployment Instructions

1. Open **[Google Apps Script](https://script.google.com/)** in your browser.
2. Click **New project** (top-left).
3. Name your project: `Solar Web Enquiry Dispatcher`.
4. Delete any code in the editor and paste the entire contents of [`Code.gs`](./Code.gs).
5. Click **Save** (💾 icon).
6. Click **Deploy** > **New deployment** (top-right).
   - Click the gear icon (⚙️) next to *Select type* and select **Web app**.
   - **Description**: `Solar Enquiry Web App v1`
   - **Execute as**: `Me (<your-email>)`
   - **Who has access**: `Anyone` *(Crucial so the website can submit enquiries)*
7. Click **Deploy**.
8. Click **Authorize access** and choose your Google account. (If you see "Google hasn't verified this app", click *Advanced* > *Go to Solar Web Enquiry Dispatcher (unsafe)* > *Allow*).
9. Copy your **Web app URL** (it looks like `https://script.google.com/macros/s/AKfycb.../exec`).
10. Open your `.env` and `.env.local` file in `SolerPanel/` and paste the URL:
    ```env
    NEXT_PUBLIC_APPSCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
    APPSCRIPT_WEBAPP_URL=https://script.google.com/macros/s/AKfycb.../exec
    ```

---

## 📧 How Emails Are Routed
```
Website Form Submit ──> Next.js API (/api/enquiry)
                              │
                              ├── Reads TO & CC from .env
                              │   TO: arivuchezhiyan000@gmail.com
                              │   CC: kavinsoorya2470049@ssn.edu.in, ashwathram2470063@ssn.edu.in, naveenkumar2470051@ssn.edu.in
                              │
                              ▼
                      Google Apps Script Web App
                              │
                              ▼
                      Formatted HTML Email Sent via Gmail/Google Workspace
```
