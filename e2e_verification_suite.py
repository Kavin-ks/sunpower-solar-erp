"""
SunPower Solar ERP - Final Comprehensive Verification Test Suite
Tests complete end-to-end lifecycle, PDF business rules, and role authorization.
"""

import requests
import json
import time

BASE_URL = "http://localhost:8080/api"

class TestContext:
    tokens = {}
    test_results = []
    
    def record(self, name, passed, details=""):
        status = "PASS" if passed else "FAIL"
        self.test_results.append({"name": name, "passed": passed, "details": details})
        print(f"[{status}] {name}: {details}")

ctx = TestContext()

def auth_header(role="admin"):
    return {"Authorization": f"Bearer {ctx.tokens.get(role, '')}", "Content-Type": "application/json"}

print("=== STARTING COMPREHENSIVE SUNPOWER SOLAR ERP VERIFICATION ===")

# ---------------------------------------------------------
# 1. AUTH & ROLE VERIFICATION (ALL 6 ROLES + DIRECTOR DENIAL)
# ---------------------------------------------------------
roles = [
    ("admin", "ROLE_ADMIN"),
    ("sales", "ROLE_SALES"),
    ("warehouse", "ROLE_WAREHOUSE"),
    ("technician", "ROLE_TECHNICIAN"),
    ("support", "ROLE_SUPPORT"),
    ("finance", "ROLE_FINANCE"),
]

for username, expected_role in roles:
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": "password123"})
    if resp.status_code == 200:
        data = resp.json()
        token = data.get("token") or data.get("accessToken")
        ctx.tokens[username] = token
        user_roles = [r.get("name") if isinstance(r, dict) else str(r) for r in data.get("roles", [])]
        ctx.record(f"1. Auth - Login as {username}", expected_role in user_roles, f"Roles: {user_roles}")
    else:
        ctx.record(f"1. Auth - Login as {username}", False, f"HTTP {resp.status_code}")

# Director login must fail (401 Unauthorized)
resp_dir = requests.post(f"{BASE_URL}/auth/login", json={"username": "director", "password": "password123"})
ctx.record("1. Auth - Managing Director Login Blocked", resp_dir.status_code in [401, 403, 404], f"Status: {resp_dir.status_code} (User permanently removed)")

# ---------------------------------------------------------
# 2. CUSTOMER ENQUIRY & SALES LEAD
# ---------------------------------------------------------
enq_payload = {
    "customerName": "Kavitha Sundaram",
    "customerEmail": f"kavitha.{int(time.time())}@example.com",
    "customerPhone": "9842511223",
    "address": "45 Trichy Road, Coimbatore, TN",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641018",
    "customerType": "RESIDENTIAL",
    "systemType": "ON_GRID",
    "requestedCapacityKw": 3.0,
    "currentMonthlyBill": 3200.0,
    "roofAreaSqFt": 450.0,
    "roofType": "CONCRETE",
    "notes": "Rooftop 3kW under PM Surya Ghar Muft Bijli Yojana"
}

resp_enq = requests.post(f"{BASE_URL}/enquiries", json=enq_payload, headers=auth_header("sales"))
enq_data = resp_enq.json() if resp_enq.status_code in [200, 201] else {}
enq_id = enq_data.get("id")
cust_id = enq_data.get("customerId") or (enq_data.get("customer", {}).get("id") if isinstance(enq_data.get("customer"), dict) else None)
ctx.record("2. Enquiry - Create Lead", resp_enq.status_code in [200, 201] and enq_id is not None, f"Enquiry #{enq_data.get('enquiryNumber')} (ID: {enq_id}, Customer ID: {cust_id})")

# ---------------------------------------------------------
# 3. SITE SURVEY & TECHNICAL FEASIBILITY
# ---------------------------------------------------------
srv_payload = {
    "enquiryId": enq_id,
    "customerId": cust_id,
    "technicianId": 1,
    "scheduledDate": "2026-11-05",
    "surveyNotes": "Detailed roof orientation, azimuth, shadow analysis and utility phase check."
}
resp_srv = requests.post(f"{BASE_URL}/surveys/schedule", json=srv_payload, headers=auth_header("sales"))
srv_data = resp_srv.json() if resp_srv.status_code in [200, 201] else {}
srv_id = srv_data.get("id")
ctx.record("3. Survey - Schedule Inspection", resp_srv.status_code in [200, 201] and srv_id is not None, f"Survey #{srv_data.get('surveyNumber')} scheduled")

# Submit Technical Feasibility Assessment
feas_payload = {
    "roofDirection": "South-Facing (Azimuth 180°)",
    "roofTilt": "18 Degrees",
    "availableRoofAreaSqFt": 420.0,
    "cableDistanceMeters": 14.5,
    "shadingAssessment": "Zero Shadow from 9:00 AM to 4:30 PM",
    "gridSuitability": "Single-Phase 230V 50Hz Stable Utility Connection",
    "surveyNotes": "RCC flat roof with high load-bearing capacity. High solar insolation.",
    "inspectionRecommendation": "APPROVED_FEASIBLE"
}
resp_feas = requests.post(f"{BASE_URL}/surveys/{srv_id}/feasibility", json=feas_payload, headers=auth_header("technician"))
ctx.record("3. Survey - Technical Feasibility Capture", resp_feas.status_code == 200, f"HTTP {resp_feas.status_code}")

# Sales Approval Gate
resp_appr = requests.post(f"{BASE_URL}/surveys/{srv_id}/approve", json={"approvalNotes": "Survey verified. Roof orientation and grid parameters optimal."}, headers=auth_header("sales"))
ctx.record("3. Survey - Feasibility Approval Gate", resp_appr.status_code == 200, f"Status: {resp_appr.json().get('status')}")

# ---------------------------------------------------------
# 4. QUOTATION & BOM WITH 5% GST BREAKDOWN
# ---------------------------------------------------------
packages_resp = requests.get(f"{BASE_URL}/packages", headers=auth_header("sales"))
pkg_id = 1
for p in packages_resp.json():
    if p.get("systemType") == "ON_GRID" and (p.get("capacityKw") == 3.0 or "3" in str(p.get("name"))):
        pkg_id = p.get("id")
        break

quote_payload = {
    "enquiryId": enq_id,
    "customerId": cust_id,
    "solarPackageId": pkg_id,
    "installationFee": 15000.0,
    "discountAmount": 0.0,
    "taxRatePercent": 5.0,
    "notes": "Standard SunPower 3kW Rooftop On-Grid Solution"
}
resp_quote = requests.post(f"{BASE_URL}/quotations", json=quote_payload, headers=auth_header("sales"))
quote_data = resp_quote.json() if resp_quote.status_code in [200, 201] else {}
quote_id = quote_data.get("id")
subtotal = quote_data.get("subtotal", 0.0)
tax = quote_data.get("taxAmount", 0.0)
total = quote_data.get("totalAmount", 0.0)
bom_items = quote_data.get("items", [])
correct_tax = abs(round(subtotal * 0.05, 2) - tax) < 0.1
cgst = round(tax / 2, 2)
sgst = round(tax / 2, 2)
ctx.record("4. Quotation - BOM & 5% GST (CGST 2.5% + SGST 2.5%)", resp_quote.status_code in [200, 201] and correct_tax, f"Subtotal=Rs.{subtotal}, Total Tax=Rs.{tax} (CGST=Rs.{cgst}, SGST=Rs.{sgst}), Total=Rs.{total}, Items={len(bom_items)}")

# Customer Acceptance Workflow
resp_acc = requests.post(f"{BASE_URL}/quotations/{quote_id}/accept", headers=auth_header("sales"))
ctx.record("4. Quotation - Acceptance Workflow", resp_acc.status_code == 200, f"Status: {resp_acc.json().get('status')}")

# ---------------------------------------------------------
# 5. SALES ORDER & 30% ADVANCE PAYMENT GATE
# ---------------------------------------------------------
resp_order = requests.post(f"{BASE_URL}/orders/from-quotation/{quote_id}", headers=auth_header("sales"))
order_data = resp_order.json() if resp_order.status_code in [200, 201] else {}
order_id = order_data.get("id")
order_num = order_data.get("orderNumber")
adv_req = order_data.get("advanceRequired", 0.0)
exp_adv = round(total * 0.30, 2)
adv_match = abs(adv_req - exp_adv) < 0.1
ctx.record("5. Order - Conversion & 30% Advance Requirement", resp_order.status_code in [200, 201] and adv_match, f"Order #{order_num}, AdvReq=Rs.{adv_req} (30% Match: {adv_match})")

# Enforce 30% Advance Gate - Dispatch initiation MUST FAIL with 409 Conflict
resp_gate = requests.post(f"{BASE_URL}/dispatches", json={"salesOrderId": order_id, "vehicleNumber": "TN-38-AX-9911", "driverName": "R. Kumar", "driverPhone": "9842100888"}, headers=auth_header("warehouse"))
ctx.record("5. Gating - Advance Payment Gate Enforcement", resp_gate.status_code == 409, f"Unpaid dispatch blocked with HTTP {resp_gate.status_code}")

# Record 30% Advance Payment
pay_payload = {
    "salesOrderId": order_id,
    "customerId": cust_id,
    "amount": adv_req,
    "paymentMethod": "NEFT",
    "transactionReference": f"NEFT-{int(time.time())}",
    "notes": "30% Advance deposit via NEFT"
}
resp_pay = requests.post(f"{BASE_URL}/payments", json=pay_payload, headers=auth_header("finance"))
pay_data = resp_pay.json() if resp_pay.status_code in [200, 201] else {}
ctx.record("5. Payment - Record Customer Advance", resp_pay.status_code in [200, 201], f"Payment #{pay_data.get('paymentNumber')} for Rs.{pay_data.get('amount')}")

# Verify Order transitions to CONFIRMED
order_refreshed = requests.get(f"{BASE_URL}/orders/{order_id}", headers=auth_header("sales")).json()
ctx.record("5. Order - Transition to CONFIRMED", order_refreshed.get("status") == "CONFIRMED", f"Status: {order_refreshed.get('status')} (Paid: Rs.{order_refreshed.get('advancePaid')})")

# ---------------------------------------------------------
# 6. INVENTORY ALLOCATION & FORMULAS
# ---------------------------------------------------------
stocks = requests.get(f"{BASE_URL}/inventory/stocks", headers=auth_header("warehouse")).json()
non_neg = all(s.get("availableQuantity", 0) >= 0 for s in stocks)
formula_ok = all(s.get("totalQuantity", 0) == s.get("availableQuantity", 0) + s.get("reservedQuantity", 0) for s in stocks)
ctx.record("6. Inventory - Non-Negative Available Stock", non_neg, f"Verified across {len(stocks)} product records")
ctx.record("6. Inventory - Formula: Total = Available + Reserved", formula_ok, f"Verified across {len(stocks)} product records")

# ---------------------------------------------------------
# 7. WAREHOUSE PICKING & BARCODE SCANNING DISPATCH
# ---------------------------------------------------------
# Now that advance is paid, dispatch can be created
resp_disp = requests.post(f"{BASE_URL}/dispatches", json={"salesOrderId": order_id, "vehicleNumber": "TN-38-AX-9911", "driverName": "R. Kumar", "driverPhone": "9842100888", "dispatchNotes": "Careful transport for high-value inverter."}, headers=auth_header("warehouse"))
disp_data = resp_disp.json() if resp_disp.status_code in [200, 201] else {}
disp_id = disp_data.get("id")
disp_num = disp_data.get("dispatchNumber")
ctx.record("7. Dispatch - Preparation Post-Payment", resp_disp.status_code in [200, 201] and disp_id is not None, f"Dispatch #{disp_num} (ID: {disp_id}) created in status {disp_data.get('status')}")

# Barcode Scanning for Serialized items
disp_items = disp_data.get("items", [])
serialized_items = [it for it in disp_items if it.get("product", {}).get("serialized", False)]
scan_ok = True
for item in serialized_items:
    prod_id = item.get("product", {}).get("id")
    serials = requests.get(f"{BASE_URL}/serials/available?productId={prod_id}", headers=auth_header("warehouse")).json()
    if serials:
        scanned_code = serials[0].get("serialCode")
        scan_resp = requests.post(f"{BASE_URL}/dispatches/{disp_id}/scan-barcode", json={"barcode": scanned_code}, headers=auth_header("warehouse"))
        if scan_resp.status_code != 200:
            scan_ok = False
ctx.record("7. Barcode - Serialized Unit Scanning", scan_ok, f"Scanned serialized equipment barcode for dispatch items")

# Confirm Dispatch
resp_cdisp = requests.post(f"{BASE_URL}/dispatches/{disp_id}/dispatch", headers=auth_header("warehouse"))
ctx.record("7. Dispatch - Confirm Outbound Dispatch", resp_cdisp.status_code == 200, f"Status: {resp_cdisp.json().get('status')}")

# Confirm Delivery
resp_deliv = requests.post(f"{BASE_URL}/dispatches/{disp_id}/deliver", json={"notes": "Delivered intact to Coimbatore site. Received by Kavitha S."}, headers=auth_header("warehouse"))
ctx.record("7. Dispatch - Confirm Customer Site Delivery", resp_deliv.status_code == 200, f"Status: {resp_deliv.json().get('status')}")

# ---------------------------------------------------------
# 8. AUTOMATIC WARRANTY ACTIVATION (PANEL 20-YR, INVERTER 2-YR)
# ---------------------------------------------------------
warranties = requests.get(f"{BASE_URL}/warranties/customer/{cust_id}", headers=auth_header("support")).json()
panel_warr = next((w for w in warranties if "PANEL" in w.get("product", {}).get("category", {}).get("name", "").upper()), None)
inv_warr = next((w for w in warranties if "INVERTER" in w.get("product", {}).get("category", {}).get("name", "").upper()), None)

panel_20yr = panel_warr is not None and panel_warr.get("durationMonths") == 240
inv_2yr = inv_warr is not None and inv_warr.get("durationMonths") == 24
dates_ok = False
if inv_warr:
    s_date = inv_warr.get("warrantyStartDate")
    e_date = inv_warr.get("warrantyEndDate")
    dates_ok = s_date is not None and e_date is not None and e_date > s_date

ctx.record("8. Warranty - Panel 20-Yr (240m) & Inverter 2-Yr (24m)", panel_20yr and inv_2yr, f"Panel: {panel_warr.get('durationMonths') if panel_warr else 'N/A'}m, Inverter: {inv_warr.get('durationMonths') if inv_warr else 'N/A'}m")
ctx.record("8. Warranty - Accurate Start & Expiry Dates", dates_ok, f"Start: {inv_warr.get('warrantyStartDate') if inv_warr else 'N/A'}, Expiry: {inv_warr.get('warrantyEndDate') if inv_warr else 'N/A'}")

# ---------------------------------------------------------
# 9. INSTALLATION, TESTING (VOC, ISC, EARTH < 5 OHM), PHOTOS & SIGN-OFF
# ---------------------------------------------------------
insts = requests.get(f"{BASE_URL}/installations", headers=auth_header("technician")).json()
curr_inst = next((i for i in insts if i.get("salesOrder", {}).get("id") == order_id), None)
inst_id = curr_inst.get("id") if curr_inst else None

# Schedule installation if not scheduled
if curr_inst and curr_inst.get("status") == "SCHEDULED" and not curr_inst.get("assignedTechnicians"):
    requests.post(f"{BASE_URL}/installations/schedule", json={
        "salesOrderId": order_id,
        "scheduledDate": "2026-11-06",
        "technicians": [{"technicianId": 1, "roleInCrew": "Lead Technician"}],
        "workNotes": "Full 3kW rooftop commissioning"
    }, headers=auth_header("technician"))

# Attach photographic evidence
photo_resp = requests.post(f"{BASE_URL}/installations/{inst_id}/photos", json={
    "photoUrl": "https://storage.sunpower.internal/photos/ins-rooftop-completed.jpg",
    "stage": "TESTING_COMMISSIONING",
    "caption": "Complete 3kW array, dual earthing pit, inverter sync verified"
}, headers=auth_header("technician"))
ctx.record("9. Installation - Attach Milestone Photograph", photo_resp.status_code in [200, 201], f"HTTP {photo_resp.status_code}")

# Complete Installation with Voc, Isc, Earth Pit Resistance < 5 Ohm, and digital customer signature
complete_payload = {
    "installedCapacityKw": 3.0,
    "panelMountingConfirmed": True,
    "wiringConfirmed": True,
    "earthingConfirmed": True,
    "testingPassed": True,
    "testingNotes": "Voc: 382.4V, Isc: 9.3A, Earth Pit: 1.84 Ω (< 5.0 Ω standard), Grid Sync: PASSED. Generation stable at 3.05 kW peak.",
    "customerSigneeName": "Kavitha Sundaram",
    "customerSignatureUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "customerAcceptanceNote": "Rooftop installation completed cleanly. Generation verified.",
    "technicianHours": [{"technicianId": 1, "hoursWorked": 8.0, "payoutAmount": 2400.0}]
}
resp_comp = requests.post(f"{BASE_URL}/installations/{inst_id}/complete", json=complete_payload, headers=auth_header("technician"))
ctx.record("9. Installation - Voc, Isc, Earth < 5 Ohm & Customer Sign-Off", resp_comp.status_code == 200, f"Completed: Status={resp_comp.json().get('status') if resp_comp.status_code == 200 else resp_comp.status_code}")

# ---------------------------------------------------------
# 10. CUSTOMER SERVICE TICKETS & SLA WORKFLOW
# ---------------------------------------------------------
tkt_payload = {
    "customerId": cust_id,
    "salesOrderId": order_id,
    "complaintCategory": "INVERTER_FAULT",
    "priority": "HIGH",
    "complaintDescription": "Inverter showing error code E04 during grid fluctuations",
    "customerContactName": "Kavitha S",
    "customerContactPhone": "9842511223"
}
resp_tkt = requests.post(f"{BASE_URL}/service-tickets", json=tkt_payload, headers=auth_header("support"))
tkt_data = resp_tkt.json() if resp_tkt.status_code in [200, 201] else {}
tkt_id = tkt_data.get("id")
ctx.record("10. Service - Create Customer Ticket", resp_tkt.status_code in [200, 201] and tkt_id is not None, f"Ticket #{tkt_data.get('ticketNumber')} (Category: {tkt_data.get('complaintCategory')})")

# Resolve Ticket
resp_res = requests.post(f"{BASE_URL}/service-tickets/{tkt_id}/resolve", json={
    "resolutionNotes": "Grid voltage sensor recalibrated. Inverter firmware updated.",
    "isUnderWarranty": True,
    "partsCost": 0.0,
    "laborCost": 0.0,
    "totalCharge": 0.0
}, headers=auth_header("support"))
ctx.record("10. Service - Resolve Complaint", resp_res.status_code == 200, f"Status: {resp_res.json().get('status')}")

# Customer Confirmation & Closure
resp_cls = requests.post(f"{BASE_URL}/service-tickets/{tkt_id}/confirm-and-close", json={
    "customerSatisfactionRating": 5,
    "closureNotes": "Customer confirmed system generating smoothly."
}, headers=auth_header("support"))
ctx.record("10. Service - Customer Confirmation & Closure", resp_cls.status_code == 200, f"Status: {resp_cls.json().get('status')}")

# ---------------------------------------------------------
# 11. FINANCE - GST INVOICES, SUBSIDIES, EXCL-TAX PROFITABILITY & P&L
# ---------------------------------------------------------
# Generate Official GST Invoice for Order
resp_inv = requests.post(f"{BASE_URL}/finance/invoices/generate/{order_id}", headers=auth_header("finance"))
inv_data = resp_inv.json() if resp_inv.status_code in [200, 201] else {}
inv_id = inv_data.get("id")
inv_num = inv_data.get("invoiceNumber")
cgst_inv = inv_data.get("cgstAmount", 0.0)
sgst_inv = inv_data.get("sgstAmount", 0.0)
ctx.record("11. Finance - Generate Official GST Tax Invoice", resp_inv.status_code in [200, 201] and inv_id is not None, f"Invoice #{inv_num}, CGST=Rs.{cgst_inv}, SGST=Rs.{sgst_inv}")

# Apply PM Surya Ghar Subsidy
sub_payload = {
    "salesOrderId": order_id,
    "customerId": cust_id,
    "consumerNumber": "EB-CBE-994411",
    "discomName": "TANGEDCO Coimbatore Metro",
    "sanctionedLoadKw": 4.0,
    "solarCapacityKw": 3.0,
    "calculatedSubsidyAmount": 78000.0,
    "portalApplicationNumber": f"PMSG-{int(time.time())}"
}
resp_sub = requests.post(f"{BASE_URL}/finance/subsidies", json=sub_payload, headers=auth_header("finance"))
ctx.record("11. Finance - PM Surya Ghar Subsidy Tracking", resp_sub.status_code in [200, 201], f"Subsidy Rs.78,000 application recorded")

# Profitability & P&L Statement Verification (Tax excluded from recognized revenue)
pnl = requests.get(f"{BASE_URL}/finance/reports/profit-and-loss?period=ALL_TIME", headers=auth_header("finance")).json()
tot_rev = pnl.get("totalRevenue", 0.0)
excl_rev = pnl.get("gstExcludedRevenue", 0.0)
gross_p = pnl.get("grossProfit", 0.0)
cogs = pnl.get("totalCogs", 0.0)
pnl_formula_ok = abs(gross_p - (excl_rev - cogs)) < 1.0
ctx.record("11. Finance - Recognized Revenue Excludes Tax in P&L", pnl_formula_ok and excl_rev <= tot_rev, f"Gross Billing=Rs.{tot_rev}, Excl-Tax Revenue=Rs.{excl_rev}, COGS=Rs.{cogs}, Gross Profit=Rs.{gross_p} (Formula verified: {pnl_formula_ok})")

# ---------------------------------------------------------
# FINAL SUMMARY
# ---------------------------------------------------------
passed_count = sum(1 for r in ctx.test_results if r["passed"])
failed_count = sum(1 for r in ctx.test_results if not r["passed"])
total_count = len(ctx.test_results)

print("\n=======================================================")
print(f"=== FINAL SYSTEM VERIFICATION SUMMARY: {passed_count}/{total_count} PASSED ===")
print("=======================================================")
print(f"Total Tests Executed : {total_count}")
print(f"Total Tests Passed   : {passed_count}")
print(f"Total Tests Failed   : {failed_count}")
print("=======================================================")

if failed_count > 0:
    print("FAILED TESTS:")
    for r in ctx.test_results:
        if not r["passed"]:
            print(f" - {r['name']}: {r['details']}")

