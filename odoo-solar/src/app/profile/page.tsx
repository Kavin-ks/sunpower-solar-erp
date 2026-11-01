'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HeaderOne from '@/layouts/headers/HeaderOne';
import FooterOne from '@/layouts/footers/FooterOne';
import Breadcrumb from '@/components/common/breadcrumb/breadcrumb';

interface CustomerSession {
  token: string;
  fullName: string;
  email: string;
  phone: string;
  customerId: number | null;
  userId: number | null;
  roles: string[];
}

interface PortalData {
  customer: any;
  enquiries: any[];
  surveys: any[];
  quotations: any[];
  orders: any[];
  payments: any[];
  dispatches: any[];
  installations: any[];
  warranties: any[];
  serviceTickets: any[];
  invoices: any[];
  subsidies: any[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ─── Status badge color helper ────────────────────────────────────
function getStatusColor(status: string): { bg: string; text: string; border: string } {
  const s = (status || '').toUpperCase();
  const map: Record<string, { bg: string; text: string; border: string }> = {
    NEW:               { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    CONTACTED:         { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    QUALIFIED:         { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    SURVEY_SCHEDULED:  { bg: '#fefce8', text: '#ca8a04', border: '#fef08a' },
    SURVEY_APPROVED:   { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
    QUOTED:            { bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd' },
    CONVERTED:         { bg: '#ecfdf5', text: '#047857', border: '#6ee7b7' },
    REJECTED:          { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    DRAFT:             { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
    SENT:              { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    ACCEPTED:          { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    EXPIRED:           { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    PENDING:           { bg: '#fefce8', text: '#ca8a04', border: '#fef08a' },
    CONFIRMED:         { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    PROCESSING:        { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    COMPLETED:         { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    DELIVERED:         { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    PAID:              { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    PARTIALLY_PAID:    { bg: '#fefce8', text: '#ca8a04', border: '#fef08a' },
    IN_PROGRESS:       { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    SCHEDULED:         { bg: '#fefce8', text: '#ca8a04', border: '#fef08a' },
    OPEN:              { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    CLOSED:            { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
    ACTIVE:            { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  };
  return map[s] || { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };
}

function StatusBadge({ status }: { status: string }) {
  const c = getStatusColor(status);
  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: '9999px',
      backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`,
      fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {(status || 'N/A').replace(/_/g, ' ')}
    </span>
  );
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

// ─── Industrial Lifecycle Steps ──────────────────────────────────
const LIFECYCLE_STEPS = [
  { key: 'enquiry', label: 'Enquiry Submitted', icon: 'bi-file-earmark-text' },
  { key: 'verified', label: 'Enquiry Verified', icon: 'bi-patch-check' },
  { key: 'survey', label: 'Site Survey', icon: 'bi-compass' },
  { key: 'quotation', label: 'Quotation Generated', icon: 'bi-calculator' },
  { key: 'accepted', label: 'Quotation Accepted', icon: 'bi-check2-circle' },
  { key: 'order', label: 'Order Placed', icon: 'bi-box-seam' },
  { key: 'installation', label: 'Installation', icon: 'bi-tools' },
  { key: 'completed', label: 'Project Completed', icon: 'bi-award' },
];

function getLifecycleProgress(data: PortalData): number {
  if (data.installations?.some(i => i.status === 'COMPLETED')) return 8;
  if (data.installations?.length > 0) return 7;
  if (data.orders?.length > 0) return 6;
  if (data.quotations?.some(q => q.status === 'ACCEPTED')) return 5;
  if (data.quotations?.length > 0) return 4;
  if (data.surveys?.length > 0) return 3;
  if (data.enquiries?.some(e => ['CONTACTED', 'QUALIFIED', 'SURVEY_SCHEDULED', 'SURVEY_APPROVED', 'QUOTED', 'CONVERTED'].includes(e.status))) return 2;
  if (data.enquiries?.length > 0) return 1;
  return 0;
}

// ─── Card Styles ──────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  border: '1px solid #e2e8f0',
  marginBottom: '24px',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '20px',
};

const iconBoxStyle = (bg: string, color: string): React.CSSProperties => ({
  width: '38px', height: '38px', borderRadius: '8px',
  backgroundColor: bg, color: color,
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
});

// ═══════════════════════════════════════════════════════════════════
//                    MAIN PROFILE / DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════

const ProfilePage = () => {
  const router = useRouter();
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'enquiries' | 'quotations' | 'orders' | 'support'>('overview');

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formPincode, setFormPincode] = useState('');

  // ─── Dual Storage Session Detection (Single Sign-On) ───────────
  useEffect(() => {
    try {
      let token = '';
      let userObj: any = null;

      const sessionStr = localStorage.getItem('odoo_erp_user_session');
      if (sessionStr) {
        try {
          const s = JSON.parse(sessionStr);
          if (s.token) token = s.token;
          if (s.user) userObj = s.user;
        } catch { /* ignore */ }
      }

      const userStr = localStorage.getItem('sunpower_user');
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          if (u.token) token = u.token;
          userObj = { ...(userObj || {}), ...u };
        } catch { /* ignore */ }
      }

      if (userObj && (userObj.email || userObj.fullName || userObj.name || userObj.phone)) {
        setSession({
          token: token || userObj.token || 'customer-session-token',
          fullName: userObj.fullName || userObj.name || 'Customer',
          email: userObj.email || '',
          phone: userObj.phone || '',
          customerId: userObj.customerId || null,
          userId: userObj.userId || userObj.id || null,
          roles: userObj.roles || [userObj.role || 'ROLE_CUSTOMER'],
        });
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  // ─── Fetch Portal Data ─────────────────────────────────────────
  const fetchPortalData = useCallback(async (token: string) => {
    setDataLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/customer/me/portal-data`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // Token expired — clear session
          localStorage.removeItem('sunpower_user');
          localStorage.removeItem('odoo_erp_user_session');
          setSession(null);
          setError('Session expired. Please log in again.');
          return;
        }
        throw new Error(`Failed to fetch data (${res.status})`);
      }
      const data = await res.json();
      setPortalData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.token) {
      fetchPortalData(session.token);
    }
  }, [session, fetchPortalData]);

  // ─── Auth Handlers ─────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOGIN',
          phone: formPhone.trim(),
          email: formEmail.trim(),
          password: formPassword,
        }),
      });
      const data = await res.json();

      if (data.success && data.token) {
        const userData = {
          ...data.user,
          fullName: data.user.fullName || data.user.name || '',
          token: data.token,
        };
        localStorage.setItem('sunpower_user', JSON.stringify(userData));
        localStorage.setItem('odoo_erp_user_session', JSON.stringify({ token: data.token, user: userData }));

        setSession({
          token: data.token,
          fullName: data.user.fullName || data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          customerId: data.user.customerId,
          userId: data.user.userId || data.user.id,
          roles: data.user.roles || ['ROLE_CUSTOMER'],
        });
      } else {
        setAuthError(data.message || 'Login failed. Please verify credentials.');
      }
    } catch (err: any) {
      setAuthError('Unable to connect. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REGISTER',
          fullName: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          password: formPassword,
          address: formAddress.trim(),
          city: formCity.trim(),
          pincode: formPincode.trim(),
        }),
      });
      const data = await res.json();

      if (data.success && data.token) {
        const userData = {
          ...data.user,
          fullName: data.user.fullName || formName.trim(),
          token: data.token,
        };
        localStorage.setItem('sunpower_user', JSON.stringify(userData));
        localStorage.setItem('odoo_erp_user_session', JSON.stringify({ token: data.token, user: userData }));

        setSession({
          token: data.token,
          fullName: data.user.fullName || formName.trim(),
          email: data.user.email,
          phone: data.user.phone,
          customerId: data.user.customerId,
          userId: data.user.userId || data.user.id,
          roles: data.user.roles || ['ROLE_CUSTOMER'],
        });
      } else {
        setAuthError(data.message || 'Registration failed.');
      }
    } catch (err: any) {
      setAuthError('Unable to connect. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sunpower_user');
    localStorage.removeItem('odoo_erp_user_session');
    setSession(null);
    setPortalData(null);
    router.push('/');
  };

  // ─── Accept Quotation Handler ──────────────────────────────────
  const handleAcceptQuotation = async (quotationId: number) => {
    if (!session?.token) return;
    if (!confirm('Are you sure you want to accept this quotation? This will create a sales order.')) return;

    try {
      const res = await fetch(`${API_BASE}/api/customer/me/quotations/${quotationId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        alert('Quotation accepted! A sales order has been created.');
        fetchPortalData(session.token);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert('Failed: ' + (errData.message || 'Could not accept quotation'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // ─── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <HeaderOne />
        <main>
          <Breadcrumb top_title="My Profile" title="Customer Dashboard" />
          <div style={{ backgroundColor: '#f8fafc', padding: '80px 0', textAlign: 'center', fontFamily: "'Jost', sans-serif" }}>
            <div className="spinner-border text-danger" role="status" />
            <p style={{ marginTop: '16px', color: '#64748b' }}>Loading dashboard...</p>
          </div>
        </main>
        <FooterOne />
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  NOT LOGGED IN → SHOW LOGIN / REGISTER FORM
  // ═══════════════════════════════════════════════════════════════
  if (!session) {
    const inputStyle: React.CSSProperties = {
      width: '100%', padding: '12px 16px', borderRadius: '10px',
      border: '1.5px solid #e2e8f0', fontSize: '14px', fontFamily: "'Jost', sans-serif", outline: 'none',
    };
    const labelStyle: React.CSSProperties = {
      fontSize: '12px', fontWeight: 700, color: '#475569',
      textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block',
    };

    return (
      <>
        <HeaderOne />
        <main>
          <Breadcrumb top_title="Customer Portal" title="Login / Register" />
          <div style={{ backgroundColor: '#f8fafc', padding: '60px 0 80px 0', fontFamily: "'Jost', sans-serif" }}>
            <div className="container">
              <div style={{ ...cardStyle, maxWidth: '520px', margin: '0 auto', padding: '40px 36px' }}>
                {/* Tab Switcher */}
                <div style={{ display: 'flex', marginBottom: '28px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
                  <button type="button" onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer',
                      backgroundColor: authMode === 'login' ? '#e63a27' : '#f8fafc', color: authMode === 'login' ? '#fff' : '#64748b', }}>
                    <i className="bi bi-shield-lock me-2"></i>Sign In
                  </button>
                  <button type="button" onClick={() => { setAuthMode('register'); setAuthError(''); }}
                    style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer',
                      backgroundColor: authMode === 'register' ? '#e63a27' : '#f8fafc', color: authMode === 'register' ? '#fff' : '#64748b', }}>
                    <i className="bi bi-person-plus me-2"></i>Create Account
                  </button>
                </div>

                {authError && (
                  <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: '20px' }}>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>{authError}
                  </div>
                )}

                {authMode === 'login' ? (
                  <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={labelStyle}>Phone Number or Email</label>
                      <input type="text" style={inputStyle} placeholder="Enter your phone number or email" value={formPhone || formEmail}
                        onChange={(e) => { const v = e.target.value; if (v.includes('@')) { setFormEmail(v); setFormPhone(''); } else { setFormPhone(v); setFormEmail(''); } }} required />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <label style={labelStyle}>Password</label>
                      <input type="password" style={inputStyle} placeholder="Enter your password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} required />
                    </div>
                    <button type="submit" disabled={authLoading}
                      style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#e63a27', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer', opacity: authLoading ? 0.7 : 1 }}>
                      {authLoading ? 'Signing in...' : 'Sign In to Customer Dashboard'}
                    </button>
                    <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
                      Don&apos;t have an account?{' '}
                      <button type="button" onClick={() => setAuthMode('register')} style={{ color: '#e63a27', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Create one now</button>
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleRegister}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Full Name *</label>
                      <input type="text" style={inputStyle} placeholder="Enter your full name" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Phone Number *</label>
                      <input type="tel" style={inputStyle} placeholder="10-digit mobile number" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Email (Optional)</label>
                      <input type="email" style={inputStyle} placeholder="your@email.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Password *</label>
                      <input type="password" style={inputStyle} placeholder="Create a secure password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Address</label>
                      <input type="text" style={inputStyle} placeholder="Your address" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>City</label>
                        <input type="text" style={inputStyle} placeholder="City" value={formCity} onChange={(e) => setFormCity(e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Pincode</label>
                        <input type="text" style={inputStyle} placeholder="Pincode" value={formPincode} onChange={(e) => setFormPincode(e.target.value)} />
                      </div>
                    </div>
                    <button type="submit" disabled={authLoading}
                      style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#e63a27', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer', opacity: authLoading ? 0.7 : 1 }}>
                      {authLoading ? 'Creating account...' : 'Create Account & View Dashboard'}
                    </button>
                    <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
                      Already have an account?{' '}
                      <button type="button" onClick={() => setAuthMode('login')} style={{ color: '#e63a27', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Sign in</button>
                    </p>
                  </form>
                )}
              </div>
              <div style={{ maxWidth: '520px', margin: '24px auto 0', padding: '16px 20px', borderRadius: '12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', fontWeight: 600 }}>
                  <i className="bi bi-info-circle-fill me-2"></i>Track your solar enquiry, view quotations from our sales team, accept proposals, and monitor your installation — all from your personal dashboard.
                </p>
              </div>
            </div>
          </div>
        </main>
        <FooterOne />
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  LOGGED IN → FULL CUSTOMER DASHBOARD
  // ═══════════════════════════════════════════════════════════════
  const displayName = session.fullName || 'Customer';
  const initials = displayName.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'CU';
  const lifecycleStep = portalData ? getLifecycleProgress(portalData) : 0;

  // Tab config with industrial icons
  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'bi-grid-1x2', count: null },
    { key: 'enquiries', label: 'Enquiries', icon: 'bi-clipboard2-data', count: portalData?.enquiries?.length || 0 },
    { key: 'quotations', label: 'Quotations', icon: 'bi-file-earmark-spreadsheet', count: portalData?.quotations?.length || 0 },
    { key: 'orders', label: 'Orders', icon: 'bi-box-seam', count: portalData?.orders?.length || 0 },
    { key: 'support', label: 'Support & Warranty', icon: 'bi-shield-check', count: portalData?.serviceTickets?.length || 0 },
  ];

  return (
    <>
      <HeaderOne />
      <main>
        <Breadcrumb top_title="My Dashboard" title="Customer Dashboard" />

        <div style={{ backgroundColor: '#f8fafc', padding: '40px 0 80px 0', fontFamily: "'Jost', sans-serif" }}>
          <div className="container">
            <div className="row g-4">

              {/* ═══ LEFT SIDEBAR: Profile Card ═══ */}
              <div className="col-12 col-lg-3">
                <div style={{ ...cardStyle, textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#e63a27', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '28px', margin: '0 auto 14px auto', boxShadow: '0 8px 24px rgba(230,58,39,0.35)' }}>
                    {initials}
                  </div>
                  <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>{displayName}</h4>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '9999px', backgroundColor: '#ecfdf5', color: '#059669', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>
                    <i className="bi bi-patch-check-fill me-1"></i>Verified Customer
                  </span>
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>
                    {session.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <i className="bi bi-envelope text-primary"></i>
                        <span style={{ wordBreak: 'break-all' }}>{session.email}</span>
                      </div>
                    )}
                    {session.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <i className="bi bi-telephone text-primary"></i>
                        <span>{session.phone}</span>
                      </div>
                    )}
                    {portalData?.customer?.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <i className="bi bi-geo-alt text-primary"></i>
                        <span>{portalData.customer.address}, {portalData.customer.city}</span>
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={handleLogout} style={{ width: '100%', marginTop: '16px', padding: '10px', borderRadius: '8px', border: '1.5px solid #fee2e2', backgroundColor: '#fff5f5', color: '#dc2626', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    <i className="bi bi-box-arrow-right me-2"></i>Log Out
                  </button>
                </div>

                {/* Quick Actions */}
                <div style={cardStyle}>
                  <h5 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>Quick Actions</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Link href="/contact" style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#e63a27', color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <i className="bi bi-plus-circle"></i>
                      <span>Submit New Enquiry</span>
                    </Link>
                    <Link href="/complaint" style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', textDecoration: 'none', fontSize: '13px', fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <i className="bi bi-wrench-adjustable"></i>
                      <span>Raise Support Ticket</span>
                    </Link>
                    <Link href="/service" style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', textDecoration: 'none', fontSize: '13px', fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <i className="bi bi-grid-3x3-gap"></i>
                      <span>View Solar Packages</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* ═══ MAIN CONTENT ═══ */}
              <div className="col-12 col-lg-9">

                {/* Error Banner */}
                {error && (
                  <div style={{ padding: '14px 20px', borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: '20px' }}>
                    <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
                    <button onClick={() => session?.token && fetchPortalData(session.token)} style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px' }}>
                      Retry
                    </button>
                  </div>
                )}

                {/* Data Loading */}
                {dataLoading && (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="spinner-border text-danger" role="status" />
                    <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px' }}>Loading your dashboard data...</p>
                  </div>
                )}

                {portalData && !dataLoading && (
                  <>
                    {/* ─── PROJECT LIFECYCLE PROGRESS ──────────────── */}
                    <div style={cardStyle}>
                      <div style={sectionHeaderStyle}>
                        <div style={iconBoxStyle('#eff6ff', '#2563eb')}><i className="bi bi-diagram-3-fill" /></div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Your Solar Project Progress</h4>
                          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Track every step of your solar installation journey</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto', padding: '8px 0' }}>
                        {LIFECYCLE_STEPS.map((step, i) => {
                          const isComplete = i < lifecycleStep;
                          const isCurrent = i === lifecycleStep;
                          return (
                            <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '95px' }}>
                              <div style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{
                                  width: '42px', height: '42px', borderRadius: '50%', margin: '0 auto 6px auto',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px',
                                  backgroundColor: isComplete ? '#ecfdf5' : isCurrent ? '#eff6ff' : '#f8fafc',
                                  border: `2px solid ${isComplete ? '#059669' : isCurrent ? '#2563eb' : '#cbd5e1'}`,
                                  boxShadow: isCurrent ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none',
                                  color: isComplete ? '#059669' : isCurrent ? '#2563eb' : '#64748b',
                                }}>
                                  <i className={`bi ${isComplete ? 'bi-check2' : step.icon}`}></i>
                                </div>
                                <div style={{ fontSize: '10px', fontWeight: isComplete || isCurrent ? 700 : 500, color: isComplete ? '#059669' : isCurrent ? '#2563eb' : '#94a3b8', lineHeight: 1.3 }}>
                                  {step.label}
                                </div>
                              </div>
                              {i < LIFECYCLE_STEPS.length - 1 && (
                                <div style={{ width: '20px', height: '2px', backgroundColor: isComplete ? '#059669' : '#e2e8f0', flexShrink: 0 }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ─── TAB BAR ────────────────────────────────── */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', overflowX: 'auto', padding: '4px', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
                      {tabs.map(tab => (
                        <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key as any)}
                          style={{
                            padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap',
                            backgroundColor: activeTab === tab.key ? '#ffffff' : 'transparent',
                            color: activeTab === tab.key ? '#0f172a' : '#64748b',
                            boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            display: 'flex', alignItems: 'center', gap: '8px',
                          }}>
                          <i className={`bi ${tab.icon}`}></i>
                          <span>{tab.label}</span>
                          {tab.count !== null && tab.count > 0 && (
                            <span style={{ padding: '1px 7px', borderRadius: '9999px', backgroundColor: '#e63a27', color: '#fff', fontSize: '10px' }}>{tab.count}</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* ═══ TAB: OVERVIEW ═══ */}
                    {activeTab === 'overview' && (
                      <>
                        {/* Summary Cards */}
                        <div className="row g-3" style={{ marginBottom: '24px' }}>
                          {[
                            { label: 'Enquiries', count: portalData.enquiries.length, icon: 'bi-clipboard2-data', color: '#2563eb', bg: '#eff6ff' },
                            { label: 'Quotations', count: portalData.quotations.length, icon: 'bi-file-earmark-spreadsheet', color: '#059669', bg: '#ecfdf5' },
                            { label: 'Orders', count: portalData.orders.length, icon: 'bi-box-seam', color: '#d97706', bg: '#fefce8' },
                            { label: 'Installations', count: portalData.installations.length, icon: 'bi-tools', color: '#dc2626', bg: '#fef2f2' },
                          ].map(item => (
                            <div key={item.label} className="col-6 col-md-3">
                              <div style={{ ...cardStyle, textAlign: 'center', marginBottom: 0, padding: '20px 12px' }}>
                                <div style={{ fontSize: '24px', marginBottom: '8px', color: item.color }}>
                                  <i className={`bi ${item.icon}`}></i>
                                </div>
                                <div style={{ fontSize: '28px', fontWeight: 900, color: item.color }}>{item.count}</div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{item.label}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Latest Enquiry Status */}
                        {portalData.enquiries.length > 0 && (
                          <div style={cardStyle}>
                            <div style={sectionHeaderStyle}>
                              <div style={iconBoxStyle('#eff6ff', '#2563eb')}><i className="bi bi-clipboard2-check"></i></div>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Latest Enquiry Status</h4>
                                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Your most recent solar enquiry</p>
                              </div>
                            </div>
                            {(() => {
                              const e = portalData.enquiries[portalData.enquiries.length - 1];
                              return (
                                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Enquiry #{e.id}</div>
                                    <StatusBadge status={e.status} />
                                  </div>
                                  <div className="row g-2" style={{ fontSize: '13px', color: '#475569' }}>
                                    <div className="col-6 col-md-3"><span style={{ fontWeight: 600 }}>System Size:</span><br/>{e.systemSize ? `${e.systemSize} kW` : '—'}</div>
                                    <div className="col-6 col-md-3"><span style={{ fontWeight: 600 }}>Monthly Bill:</span><br/>{e.monthlyBill ? formatCurrency(e.monthlyBill) : '—'}</div>
                                    <div className="col-6 col-md-3"><span style={{ fontWeight: 600 }}>Roof Type:</span><br/>{e.roofType || '—'}</div>
                                    <div className="col-6 col-md-3"><span style={{ fontWeight: 600 }}>Submitted:</span><br/>{formatDate(e.createdAt)}</div>
                                  </div>
                                  {['CONTACTED', 'QUALIFIED', 'SURVEY_SCHEDULED', 'SURVEY_APPROVED', 'QUOTED', 'CONVERTED'].includes(e.status) && (
                                    <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>
                                        <i className="bi bi-patch-check-fill me-2"></i>Your enquiry has been verified and accepted by our sales team!
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* Latest Quotation */}
                        {portalData.quotations.length > 0 && (
                          <div style={cardStyle}>
                            <div style={sectionHeaderStyle}>
                              <div style={iconBoxStyle('#ecfdf5', '#059669')}><i className="bi bi-file-earmark-spreadsheet"></i></div>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Latest Quotation from ERP Sales Team</h4>
                                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Official solar engineering proposal and pricing for your property</p>
                              </div>
                            </div>
                            {(() => {
                              const q = portalData.quotations[portalData.quotations.length - 1];
                              const quoteNo = q.quotationNumber || `QT-${String(q.id).padStart(5, '0')}`;
                              const capacity = q.capacityKw ? `${q.capacityKw} kW` : (q.systemSize ? `${q.systemSize} kW` : '—');
                              const packageName = q.solarPackage?.name || (q.systemType ? `${String(q.systemType).replace(/_/g, ' ')} Solar System` : 'Rooftop Solar System');

                              return (
                                <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                  {/* Quotation Header */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{quoteNo}</span>
                                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                                        <i className="bi bi-patch-check-fill me-1"></i>ERP Verified Proposal
                                      </span>
                                    </div>
                                    <StatusBadge status={q.status} />
                                  </div>

                                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '14px' }}>
                                    <i className="bi bi-sun-fill me-2 text-warning"></i>{packageName} ({capacity})
                                  </div>

                                  {/* Financial Metrics Cards */}
                                  <div className="row g-2" style={{ marginBottom: '16px' }}>
                                    <div className="col-6 col-md-3">
                                      <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Equipment Subtotal</div>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{formatCurrency(q.subtotal)}</div>
                                      </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                      <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Solar GST (5%)</div>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{formatCurrency(q.taxAmount)}</div>
                                      </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                      <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Installation & BOS</div>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{formatCurrency(q.installationFee)}</div>
                                      </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                      <div style={{ padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>Total Net Payable</div>
                                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{formatCurrency(q.totalAmount || q.finalAmount)}</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Quotation Dates */}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                                    <span><i className="bi bi-calendar-event me-1 text-primary"></i>Issued: <strong>{formatDate(q.quotationDate || q.createdAt)}</strong></span>
                                    <span><i className="bi bi-calendar3 me-1 text-danger"></i>Valid Until: <strong>{formatDate(q.validityDate || q.validUntil)}</strong></span>
                                    {q.siteSurvey && (
                                      <span><i className="bi bi-geo-alt me-1 text-success"></i>Ref Survey #{q.siteSurvey.surveyNumber || q.siteSurvey.id}</span>
                                    )}
                                  </div>

                                  {/* Notes from Sales Team */}
                                  {q.notes && (
                                    <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '13px', color: '#1e40af', marginBottom: '16px' }}>
                                      <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <i className="bi bi-chat-left-quote-fill text-primary"></i>Note from ERP Sales Team:
                                      </div>
                                      <div>{q.notes}</div>
                                    </div>
                                  )}

                                  {/* Line Items Table */}
                                  {q.items && q.items.length > 0 && (
                                    <div style={{ marginBottom: '16px' }}>
                                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Itemized Bill of Materials (BOM) — {q.items.length} Components
                                      </div>
                                      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', backgroundColor: '#ffffff' }}>
                                          <thead>
                                            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                                              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Component / Description</th>
                                              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Qty</th>
                                              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Unit Price</th>
                                              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Total</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {q.items.map((item: any, idx: number) => {
                                              const pName = item.product?.name || item.productName || item.name || `Solar Component ${idx + 1}`;
                                              const pCode = item.product?.productCode;
                                              return (
                                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                  <td style={{ padding: '10px 12px' }}>
                                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{pName}</div>
                                                    {pCode && <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>Code: {pCode}</div>}
                                                  </td>
                                                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                                                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569' }}>{formatCurrency(item.unitPrice)}</td>
                                                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(item.totalPrice)}</td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}

                                  {/* Action Buttons */}
                                  {(q.status === 'SENT' || q.status === 'DRAFT') && (
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                      <button type="button" onClick={() => handleAcceptQuotation(q.id)}
                                        style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', backgroundColor: '#059669', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)' }}>
                                        <i className="bi bi-check2-circle"></i>
                                        <span>Accept Quotation & Proceed to Order</span>
                                      </button>
                                      <button type="button" onClick={() => window.print()}
                                        style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <i className="bi bi-printer"></i>
                                        <span>Print Proposal</span>
                                      </button>
                                    </div>
                                  )}

                                  {q.status === 'ACCEPTED' && (
                                    <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="bi bi-check-circle-fill"></i>You have accepted this quotation. Your Sales Order has been generated!
                                      </span>
                                      <button type="button" onClick={() => setActiveTab('orders')}
                                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#059669', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                        View Orders & Payments &rarr;
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* No Data State */}
                        {portalData.enquiries.length === 0 && portalData.quotations.length === 0 && (
                          <div style={{ ...cardStyle, textAlign: 'center', padding: '40px' }}>
                            <div style={{ fontSize: '44px', marginBottom: '16px', color: '#e63a27' }}>
                              <i className="bi bi-sun"></i>
                            </div>
                            <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>No Enquiries Yet</h4>
                            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>Submit your first solar enquiry to get started. Our sales team will review and send you a quotation.</p>
                            <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', backgroundColor: '#e63a27', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>
                              <i className="bi bi-plus-circle"></i>
                              <span>Submit Solar Enquiry</span>
                            </Link>
                          </div>
                        )}
                      </>
                    )}

                    {/* ═══ TAB: ENQUIRIES ═══ */}
                    {activeTab === 'enquiries' && (
                      <div style={cardStyle}>
                        <div style={sectionHeaderStyle}>
                          <div style={iconBoxStyle('#eff6ff', '#2563eb')}><i className="bi bi-clipboard2-data"></i></div>
                          <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>All Enquiries</h4>
                        </div>
                        {portalData.enquiries.length === 0 ? (
                          <p style={{ color: '#64748b', fontSize: '14px' }}>No enquiries found. <Link href="/contact" style={{ color: '#e63a27', fontWeight: 700 }}>Submit one now.</Link></p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {portalData.enquiries.map((e: any) => (
                              <div key={e.id} style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Enquiry #{e.id}</span>
                                  <StatusBadge status={e.status} />
                                </div>
                                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                  {e.systemSize && <span><i className="bi bi-battery-charging me-1 text-primary"></i>{e.systemSize} kW</span>}
                                  {e.monthlyBill && <span><i className="bi bi-currency-rupee me-1 text-primary"></i>{formatCurrency(e.monthlyBill)}/mo</span>}
                                  {e.roofType && <span><i className="bi bi-house-gear me-1 text-primary"></i>{e.roofType}</span>}
                                  <span><i className="bi bi-calendar3 me-1 text-primary"></i>{formatDate(e.createdAt)}</span>
                                </div>
                                {['CONTACTED', 'QUALIFIED', 'SURVEY_SCHEDULED', 'SURVEY_APPROVED', 'QUOTED', 'CONVERTED'].includes(e.status) && (
                                  <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700, color: '#059669' }}>
                                    <i className="bi bi-patch-check-fill me-1"></i>Verified & Accepted by Sales Team
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ═══ TAB: QUOTATIONS ═══ */}
                    {activeTab === 'quotations' && (
                      <div style={cardStyle}>
                        <div style={sectionHeaderStyle}>
                          <div style={iconBoxStyle('#ecfdf5', '#059669')}><i className="bi bi-file-earmark-spreadsheet"></i></div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Quotations Raised by ERP Sales Team</h4>
                              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                                {portalData.quotations.length} {portalData.quotations.length === 1 ? 'Proposal' : 'Proposals'}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Custom engineering proposals generated exclusively for your registered account</p>
                          </div>
                        </div>

                        {portalData.quotations.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '36px 20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '36px', color: '#94a3b8', marginBottom: '12px' }}><i className="bi bi-hourglass-split"></i></div>
                            <h5 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>No Quotations Generated Yet</h5>
                            <p style={{ color: '#64748b', fontSize: '13px', maxWidth: '440px', margin: '0 auto 16px' }}>
                              Our certified solar engineers are currently reviewing your property details and site inspection report to prepare your tailored proposal.
                            </p>
                            <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '8px', backgroundColor: '#e63a27', color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
                              <i className="bi bi-plus-circle"></i>
                              <span>Submit New Solar Enquiry</span>
                            </Link>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {portalData.quotations.map((q: any) => {
                              const quoteNo = q.quotationNumber || `QT-${String(q.id).padStart(5, '0')}`;
                              const capacity = q.capacityKw ? `${q.capacityKw} kW` : (q.systemSize ? `${q.systemSize} kW` : '—');
                              const packageName = q.solarPackage?.name || (q.systemType ? `${String(q.systemType).replace(/_/g, ' ')} Solar System` : 'Rooftop Solar System');

                              return (
                                <div key={q.id} style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                  {/* Quotation Header */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <span style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>{quoteNo}</span>
                                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                                        <i className="bi bi-patch-check-fill me-1"></i>Official Sales Proposal
                                      </span>
                                    </div>
                                    <StatusBadge status={q.status} />
                                  </div>

                                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
                                    <i className="bi bi-sun-fill me-2 text-warning"></i>{packageName} &bull; Capacity: <span style={{ color: '#2563eb' }}>{capacity}</span>
                                  </div>

                                  {/* Financial Metrics Cards */}
                                  <div className="row g-2" style={{ marginBottom: '16px' }}>
                                    <div className="col-6 col-md-3">
                                      <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Subtotal</div>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{formatCurrency(q.subtotal)}</div>
                                      </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                      <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>GST Tax (5%)</div>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{formatCurrency(q.taxAmount)}</div>
                                      </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                      <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Installation & BOS</div>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{formatCurrency(q.installationFee)}</div>
                                      </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                      <div style={{ padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>Total Investment</div>
                                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{formatCurrency(q.totalAmount || q.finalAmount)}</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Quotation Metadata Row */}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                                    <span><i className="bi bi-calendar-check me-1 text-primary"></i>Issued: <strong>{formatDate(q.quotationDate || q.createdAt)}</strong></span>
                                    <span><i className="bi bi-clock-history me-1 text-danger"></i>Valid Until: <strong>{formatDate(q.validityDate || q.validUntil)}</strong></span>
                                    {q.siteSurvey && (
                                      <span><i className="bi bi-geo-alt me-1 text-success"></i>Ref Survey #{q.siteSurvey.surveyNumber || q.siteSurvey.id}</span>
                                    )}
                                  </div>

                                  {/* Notes from Sales Team */}
                                  {q.notes && (
                                    <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '13px', color: '#1e40af', marginBottom: '16px' }}>
                                      <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <i className="bi bi-person-badge-fill text-primary"></i>Proposal Notes from Sales Engineering:
                                      </div>
                                      <div>{q.notes}</div>
                                    </div>
                                  )}

                                  {/* Bill of Materials Table */}
                                  {q.items && q.items.length > 0 && (
                                    <div style={{ marginBottom: '16px' }}>
                                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Itemized Bill of Materials (BOM) — {q.items.length} Line Items
                                      </div>
                                      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', backgroundColor: '#ffffff' }}>
                                          <thead>
                                            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                                              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Component</th>
                                              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Qty</th>
                                              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Unit Price</th>
                                              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Total</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {q.items.map((item: any, idx: number) => {
                                              const pName = item.product?.name || item.productName || item.name || `Solar Component ${idx + 1}`;
                                              const pCode = item.product?.productCode;
                                              return (
                                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                  <td style={{ padding: '10px 12px' }}>
                                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{pName}</div>
                                                    {pCode && <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>Code: {pCode}</div>}
                                                  </td>
                                                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                                                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569' }}>{formatCurrency(item.unitPrice)}</td>
                                                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(item.totalPrice)}</td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}

                                  {/* Action Buttons */}
                                  {(q.status === 'SENT' || q.status === 'DRAFT') && (
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                      <button type="button" onClick={() => handleAcceptQuotation(q.id)}
                                        style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', backgroundColor: '#059669', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)' }}>
                                        <i className="bi bi-check2-circle"></i>
                                        <span>Accept Quotation & Proceed to Order</span>
                                      </button>
                                      <button type="button" onClick={() => window.print()}
                                        style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <i className="bi bi-printer"></i>
                                        <span>Print Proposal</span>
                                      </button>
                                    </div>
                                  )}

                                  {q.status === 'ACCEPTED' && (
                                    <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="bi bi-check-circle-fill"></i>You have accepted this quotation. Your Sales Order has been generated!
                                      </span>
                                      <button type="button" onClick={() => setActiveTab('orders')}
                                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#059669', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                        View Orders & Payments &rarr;
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ═══ TAB: ORDERS ═══ */}
                    {activeTab === 'orders' && (
                      <div style={cardStyle}>
                        <div style={sectionHeaderStyle}>
                          <div style={iconBoxStyle('#fefce8', '#d97706')}><i className="bi bi-box-seam"></i></div>
                          <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Orders & Payments</h4>
                        </div>
                        {portalData.orders.length === 0 ? (
                          <p style={{ color: '#64748b', fontSize: '14px' }}>No orders yet. Accept a quotation to create your first order.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {portalData.orders.map((o: any) => (
                              <div key={o.id} style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{o.orderNumber || `Order #${o.id}`}</span>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <StatusBadge status={o.status} />
                                    {o.paymentStatus && <StatusBadge status={o.paymentStatus} />}
                                  </div>
                                </div>
                                <div className="row g-2" style={{ fontSize: '13px', color: '#475569' }}>
                                  <div className="col-6 col-md-3"><strong>Total:</strong><br/>{formatCurrency(o.totalAmount)}</div>
                                  <div className="col-6 col-md-3"><strong>Paid:</strong><br/>{formatCurrency(o.paidAmount)}</div>
                                  <div className="col-6 col-md-3"><strong>Balance:</strong><br/><span style={{ color: '#dc2626', fontWeight: 700 }}>{formatCurrency((o.totalAmount || 0) - (o.paidAmount || 0))}</span></div>
                                  <div className="col-6 col-md-3"><strong>Expected:</strong><br/>{formatDate(o.expectedDelivery)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Payments */}
                        {portalData.payments.length > 0 && (
                          <div style={{ marginTop: '24px' }}>
                            <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                              <i className="bi bi-credit-card-2-front me-2"></i>Payment History
                            </h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {portalData.payments.map((p: any) => (
                                <div key={p.id} style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                  <div>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(p.amount)}</span>
                                    <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>via {(p.paymentMethod || 'N/A').replace(/_/g, ' ')}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>{formatDate(p.paymentDate)}</span>
                                    <StatusBadge status={p.status || 'COMPLETED'} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ═══ TAB: SUPPORT ═══ */}
                    {activeTab === 'support' && (
                      <>
                        {/* Installations */}
                        {portalData.installations.length > 0 && (
                          <div style={cardStyle}>
                            <div style={sectionHeaderStyle}>
                              <div style={iconBoxStyle('#fef2f2', '#dc2626')}><i className="bi bi-tools"></i></div>
                              <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Installations</h4>
                            </div>
                            {portalData.installations.map((inst: any) => (
                              <div key={inst.id} style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <span style={{ fontWeight: 700, fontSize: '14px' }}>Installation #{inst.id}</span>
                                  <StatusBadge status={inst.status} />
                                </div>
                                <div style={{ fontSize: '12px', color: '#475569' }}>
                                  {inst.scheduledDate && <span><i className="bi bi-calendar-event me-1"></i>Scheduled: {formatDate(inst.scheduledDate)} </span>}
                                  {inst.completedDate && <span> <i className="bi bi-check-circle-fill text-success ms-2 me-1"></i>Completed: {formatDate(inst.completedDate)}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Warranties */}
                        {portalData.warranties.length > 0 && (
                          <div style={cardStyle}>
                            <div style={sectionHeaderStyle}>
                              <div style={iconBoxStyle('#ecfdf5', '#059669')}><i className="bi bi-shield-check"></i></div>
                              <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Warranties</h4>
                            </div>
                            {portalData.warranties.map((w: any) => (
                              <div key={w.id} style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 700, fontSize: '14px' }}>{(w.warrantyType || 'Warranty').replace(/_/g, ' ')}</span>
                                  <StatusBadge status={w.status} />
                                </div>
                                <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                                  {formatDate(w.startDate)} — {formatDate(w.endDate)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Service Tickets */}
                        <div style={cardStyle}>
                          <div style={sectionHeaderStyle}>
                            <div style={iconBoxStyle('#fefce8', '#d97706')}><i className="bi bi-wrench-adjustable"></i></div>
                            <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Service Tickets</h4>
                          </div>
                          {portalData.serviceTickets.length === 0 ? (
                            <p style={{ color: '#64748b', fontSize: '14px' }}>No service tickets. <Link href="/complaint" style={{ color: '#e63a27', fontWeight: 700 }}>Raise one if needed.</Link></p>
                          ) : (
                            portalData.serviceTickets.map((t: any) => (
                              <div key={t.id} style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <span style={{ fontWeight: 700, fontSize: '14px' }}>{t.ticketNumber || `Ticket #${t.id}`}</span>
                                  <StatusBadge status={t.status} />
                                </div>
                                <div style={{ fontSize: '12px', color: '#475569' }}>{t.complaintDescription}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <FooterOne />
    </>
  );
};

export default ProfilePage;
