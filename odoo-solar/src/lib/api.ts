/**
 * SunPower Solar ERP — API Client
 * Connects odoo-solar (Next.js port 3000) to Spring Boot backend (port 8080)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ─── Token Management ──────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const session = localStorage.getItem('odoo_erp_user_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.token || null;
    }
  } catch { /* ignore */ }
  return null;
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = localStorage.getItem('odoo_erp_user_session');
    const session = existing ? JSON.parse(existing) : {};
    session.token = token;
    localStorage.setItem('odoo_erp_user_session', JSON.stringify(session));
  } catch { /* ignore */ }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ─── Generic Fetch Wrapper ─────────────────────────────────────
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers as Record<string, string> || {}) },
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

// ─── Public Enquiry (No Auth Required) ─────────────────────────
export interface PublicEnquiryPayload {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  pincode?: string;
  requestedCapacityKw: number;
  systemType: 'ON_GRID' | 'OFF_GRID';
  subsidyRequired?: boolean;
  monthlyElectricityBill?: number;
  notes?: string;
}

export async function submitPublicEnquiry(payload: PublicEnquiryPayload) {
  return apiFetch('/api/enquiries/public', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Customer Auth ─────────────────────────────────────────────
export interface CustomerRegisterPayload {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  address?: string;
  city?: string;
  pincode?: string;
}

export interface CustomerLoginPayload {
  usernameOrEmailOrPhone: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  customerId: number | null;
  roles: string[];
}

export async function customerRegister(payload: CustomerRegisterPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/customer/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function customerLogin(payload: CustomerLoginPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/customer/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Staff Auth (for ERP dashboard personas) ───────────────────
export interface StaffLoginPayload {
  username: string;
  password: string;
}

export interface StaffAuthResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
}

export async function staffLogin(payload: StaffLoginPayload): Promise<StaffAuthResponse> {
  return apiFetch<StaffAuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Customer Portal Data (Authenticated) ──────────────────────
export async function getPortalData(customerId?: number) {
  const params = customerId ? `?customerId=${customerId}` : '';
  return apiFetch<any>(`/api/customer/me/portal-data${params}`);
}

export async function getMyProfile() {
  return apiFetch<any>('/api/customer/me');
}

// ─── Customer Actions ──────────────────────────────────────────
export async function acceptQuotation(quotationId: number) {
  return apiFetch<any>(`/api/customer/me/quotations/${quotationId}/accept`, { method: 'POST' });
}

export async function recordPayment(orderId: number, payload: {
  amount: number;
  method?: string;
  type?: string;
  referenceNumber?: string;
  notes?: string;
}) {
  return apiFetch<any>(`/api/customer/me/orders/${orderId}/pay`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function signOffInstallation(installationId: number, payload: {
  customerSigneeName: string;
  customerAcceptanceNote?: string;
  customerSignatureUrl?: string;
}) {
  return apiFetch<any>(`/api/customer/me/installations/${installationId}/sign-off`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function raiseServiceTicket(payload: {
  serialNumberId?: number;
  serialCode?: string;
  installationId?: number;
  complaintDescription: string;
  faultCode?: string;
}) {
  return apiFetch<any>('/api/customer/me/service-tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function confirmTicketClose(ticketId: number, payload: {
  confirmationNotes?: string;
}) {
  return apiFetch<any>(`/api/customer/me/service-tickets/${ticketId}/confirm-close`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Staff API Endpoints (for SunPowerERP.tsx) ─────────────────
export async function fetchStaffEndpoint<T>(path: string, options: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, options);
}

// Staff data fetchers
export async function getEnquiries(params?: string) {
  return apiFetch<any[]>(`/api/enquiries${params ? '?' + params : ''}`);
}

export async function getSurveys(params?: string) {
  return apiFetch<any[]>(`/api/surveys${params ? '?' + params : ''}`);
}

export async function getQuotations(params?: string) {
  return apiFetch<any[]>(`/api/quotations${params ? '?' + params : ''}`);
}

export async function getOrders(params?: string) {
  return apiFetch<any[]>(`/api/orders${params ? '?' + params : ''}`);
}

export async function getDispatches() {
  return apiFetch<any[]>('/api/dispatches');
}

export async function getInstallations(params?: string) {
  return apiFetch<any[]>(`/api/installations${params ? '?' + params : ''}`);
}

export async function getServiceTickets(params?: string) {
  return apiFetch<any[]>(`/api/service-tickets${params ? '?' + params : ''}`);
}

export async function getWarranties(params?: string) {
  return apiFetch<any[]>(`/api/warranties${params ? '?' + params : ''}`);
}

export async function getProducts() {
  return apiFetch<any[]>('/api/products');
}

export async function getPackages() {
  return apiFetch<any[]>('/api/packages');
}

export async function getInventory() {
  return apiFetch<any[]>('/api/inventory');
}

export async function getSerialNumbers(params?: string) {
  return apiFetch<any[]>(`/api/serial-numbers${params ? '?' + params : ''}`);
}

export async function getPayments(params?: string) {
  return apiFetch<any[]>(`/api/payments${params ? '?' + params : ''}`);
}

export async function getDashboard(role?: string) {
  const path = role ? `/api/dashboard/${role}` : '/api/dashboard';
  return apiFetch<any>(path);
}

export async function getFinanceDashboard(params?: string) {
  return apiFetch<any>(`/api/finance/dashboard${params ? '?' + params : ''}`);
}

export async function getTechnicians() {
  return apiFetch<any[]>('/api/technicians');
}

