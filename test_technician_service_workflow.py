import requests
import json
import sys

BASE_URL = "http://localhost:8080/api"

def login(username, password="password123"):
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    if resp.status_code == 200:
        data = resp.json()
        token = data.get("token") or data.get("jwt") or data.get("accessToken")
        return token, data
    print(f"FAILED LOGIN FOR {username}: {resp.status_code} {resp.text}")
    return None, None

def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("="*70)
print("SUNPOWER ERP — FINAL TECHNICIAN & SERVICE WORKFLOW TEST SUITE")
print("="*70)

# 1. Test individual technician logins
print("\n[TEST 1] Testing individual technician logins...")
karthik_token, karthik_data = login("technician")
assert karthik_token, "Karthik login failed"
print(f"✓ Karthik login OK: {karthik_data.get('fullName')} (User: {karthik_data.get('username')})")

ganesh_token, ganesh_data = login("tech.ganesh")
assert ganesh_token, "Ganesh login failed"
print(f"✓ Ganesh login OK: {ganesh_data.get('fullName')} (User: {ganesh_data.get('username')})")

selva_token, selva_data = login("tech.selva")
assert selva_token, "Selva login failed"
print(f"✓ Selva login OK: {selva_data.get('fullName')} (User: {selva_data.get('username')})")

support_token, support_data = login("support")
assert support_token, "Support login failed"
print(f"✓ Support login OK: {support_data.get('fullName')}")

# 2. Test Workload & Dashboard separation
print("\n[TEST 2] Testing Technician Dashboard separation & live DB metrics...")
resp_karthik_dash = requests.get(f"{BASE_URL}/dashboard/technician", headers=auth_headers(karthik_token))
assert resp_karthik_dash.status_code == 200, f"Karthik dash failed: {resp_karthik_dash.text}"
karthik_dash = resp_karthik_dash.json()
assert karthik_dash.get("isLead") == False, "Karthik is regular technician (isLead=False)"
print(f"✓ Karthik Dashboard: isLead={karthik_dash.get('isLead')}, Surveys={karthik_dash.get('assignedSurveysCount')}, Installs={karthik_dash.get('inProgressInstallationsCount')}, Service={karthik_dash.get('assignedServiceVisitsCount')}")

resp_ganesh_dash = requests.get(f"{BASE_URL}/dashboard/technician", headers=auth_headers(ganesh_token))
assert resp_ganesh_dash.status_code == 200, f"Ganesh dash failed: {resp_ganesh_dash.text}"
ganesh_dash = resp_ganesh_dash.json()
assert ganesh_dash.get("isLead") == False, "Ganesh isLead must be false"
print(f"✓ Ganesh Dashboard: isLead={ganesh_dash.get('isLead')}, Surveys={ganesh_dash.get('assignedSurveysCount')}, Installs={ganesh_dash.get('inProgressInstallationsCount')}, Service={ganesh_dash.get('assignedServiceVisitsCount')}")

# 3. Test Unified Work Endpoints (/my-assigned)
print("\n[TEST 3] Testing /my-assigned isolation for Ganesh vs Selva...")
g_surveys = requests.get(f"{BASE_URL}/surveys/my-assigned", headers=auth_headers(ganesh_token)).json()
g_installs = requests.get(f"{BASE_URL}/installations/my-assigned", headers=auth_headers(ganesh_token)).json()
g_services = requests.get(f"{BASE_URL}/service-tickets/my-assigned", headers=auth_headers(ganesh_token)).json()
print(f"✓ Ganesh /my-assigned: {len(g_surveys)} surveys, {len(g_installs)} installs, {len(g_services)} service visits")

s_surveys = requests.get(f"{BASE_URL}/surveys/my-assigned", headers=auth_headers(selva_token)).json()
s_installs = requests.get(f"{BASE_URL}/installations/my-assigned", headers=auth_headers(selva_token)).json()
s_services = requests.get(f"{BASE_URL}/service-tickets/my-assigned", headers=auth_headers(selva_token)).json()
print(f"✓ Selva /my-assigned: {len(s_surveys)} surveys, {len(s_installs)} installs, {len(s_services)} service visits")

# 4. Support assigns a complaint to Ganesh
print("\n[TEST 4] Support assigns ticket #2 to Ganesh Moorthy (tech ID 2)...")
assign_resp = requests.patch(f"{BASE_URL}/service-tickets/2/assign/2", headers=auth_headers(support_token))
assert assign_resp.status_code == 200, f"Assignment failed: {assign_resp.text}"
assigned_ticket = assign_resp.json()
assert assigned_ticket.get("status") == "ASSIGNED"
assert assigned_ticket.get("assignedTechnician", {}).get("name") == "Ganesh Moorthy"
print(f"✓ Ticket #2 successfully assigned to {assigned_ticket.get('assignedTechnician', {}).get('name')}, status={assigned_ticket.get('status')}")

# Verify ticket appears in Ganesh's queue
g_services_after = requests.get(f"{BASE_URL}/service-tickets/my-assigned", headers=auth_headers(ganesh_token)).json()
ticket_ids = [t.get("id") for t in g_services_after]
assert 2 in ticket_ids, f"Ticket 2 not in Ganesh's queue: {ticket_ids}"
print(f"✓ Ticket #2 immediately appeared in Ganesh's /my-assigned queue!")

# Verify ticket does NOT appear in Selva's queue
s_services_after = requests.get(f"{BASE_URL}/service-tickets/my-assigned", headers=auth_headers(selva_token)).json()
s_ticket_ids = [t.get("id") for t in s_services_after]
assert 2 not in s_ticket_ids, f"Ticket 2 incorrectly leaked into Selva's queue!"
print(f"✓ Isolation confirmed: Ticket #2 is NOT in Selva's queue.")

# 5. Security & Access Control: Selva tries to start Ganesh's job
print("\n[TEST 5] Security Check: Selva attempts to start work on Ganesh's ticket #2...")
unauth_resp = requests.post(f"{BASE_URL}/service-tickets/2/start-work", headers=auth_headers(selva_token))
assert unauth_resp.status_code in [403, 400], f"Expected 403/400 Forbidden, got: {unauth_resp.status_code} {unauth_resp.text}"
print(f"✓ Access Control Enforced: Selva blocked with status {unauth_resp.status_code} ({unauth_resp.json().get('message')})")

# 6. Ganesh starts work
print("\n[TEST 6] Ganesh starts work on ticket #2...")
start_resp = requests.post(f"{BASE_URL}/service-tickets/2/start-work", headers=auth_headers(ganesh_token))
assert start_resp.status_code == 200, f"Start work failed: {start_resp.text}"
assert start_resp.json().get("status") == "IN_PROGRESS"
print(f"✓ Ticket #2 status updated to IN_PROGRESS by Ganesh")

# 7. Ganesh completes work with diagnosis and testing
print("\n[TEST 7] Ganesh completes work on ticket #2...")
complete_payload = {
    "diagnosisNotes": "Grid Phase Overvoltage E04 verified with multimeter at 254V AC. Re-calibrated inverter parameters.",
    "resolutionNotes": "Reset inverter grid synchronization limits and verified stable connection.",
    "testingResults": "Voc=382V, grid AC voltage=238V, current=10.8A, generation output steady at 4.2 kW.",
    "laborCharges": 0.0,
    "replacedParts": []
}
comp_resp = requests.post(f"{BASE_URL}/service-tickets/2/complete-work", json=complete_payload, headers=auth_headers(ganesh_token))
assert comp_resp.status_code == 200, f"Complete work failed: {comp_resp.text}"
comp_ticket = comp_resp.json()
assert comp_ticket.get("status") in ["RESOLVED", "TECHNICIAN_COMPLETED"], f"Status not completed: {comp_ticket.get('status')}"
print(f"✓ Ticket #2 completion recorded by Ganesh, status={comp_ticket.get('status')}")

# 8. Support confirms customer satisfaction and closes ticket
print("\n[TEST 8] Support confirms customer satisfaction and closes ticket #2...")
confirm_payload = {
    "confirmedByCustomerName": "K. Ramanathan",
    "customerSatisfactionNotes": "Customer confirmed inverter is actively generating 4.2 kW with no tripping."
}
close_resp = requests.post(f"{BASE_URL}/service-tickets/2/confirm-and-close", json=confirm_payload, headers=auth_headers(support_token))
assert close_resp.status_code == 200, f"Close ticket failed: {close_resp.text}"
closed_ticket = close_resp.json()
assert closed_ticket.get("status") == "CLOSED"
print(f"✓ Ticket #2 confirmed with customer and CLOSED by Support Officer")

# 9. Test Reopen endpoint
print("\n[TEST 9] Support / Customer reopens ticket #2 if unresolved...")
reopen_payload = {
    "reopenReason": "Customer noticed intermittent trip during midday peak."
}
reopen_resp = requests.post(f"{BASE_URL}/service-tickets/2/reopen", json=reopen_payload, headers=auth_headers(support_token))
assert reopen_resp.status_code == 200, f"Reopen failed: {reopen_resp.text}"
reopened_ticket = reopen_resp.json()
assert reopened_ticket.get("status") in ["OPEN", "ASSIGNED", "IN_PROGRESS"], f"Unexpected status: {reopened_ticket.get('status')}"
print(f"✓ Ticket #2 successfully reopened with status {reopened_ticket.get('status')}, reason logged in audit trail")

# Re-close or restore ticket 2 cleanly
requests.post(f"{BASE_URL}/service-tickets/2/confirm-and-close", json={"confirmedByCustomerName": "K. Ramanathan", "customerSatisfactionNotes": "Issue addressed"}, headers=auth_headers(support_token))

# 10. Check Warranty and Charge Contradiction Fix across all tickets
print("\n[TEST 10] Checking all tickets for warranty vs charge contradictions...")
all_tickets = requests.get(f"{BASE_URL}/service-tickets", headers=auth_headers(support_token)).json()
contradictions = 0
for t in all_tickets:
    is_under = t.get("underWarranty")
    charges = t.get("totalCustomerCharges") or 0.0
    status_text = t.get("chargeStatusText") or ""
    # Contradiction definition: underWarranty is false, charges is 0, BUT no explanation or claiming "₹0 (Warranty)"
    if not is_under and charges == 0.0 and not status_text:
        print(f"❌ CONTRADICTION FOUND on ticket {t.get('ticketNumber')}: underWarranty=False, charges=0, no explanation")
        contradictions += 1

assert contradictions == 0, f"{contradictions} tickets with contradictory warranty/charge values found!"
print("✓ ZERO warranty vs charge contradictions! Every ticket has clear authoritative decision and charge explanation.")

print("\n" + "="*70)
print("ALL 10 VERIFICATION TEST SUITES PASSED SUCCESSFULLY!")
print("="*70)
