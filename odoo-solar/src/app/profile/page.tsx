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

// ─── Lifecycle Steps ──────────────────────────────────────────────
const LIFECYCLE_STEPS = [
  { key: 'enquiry', label: 'Enquiry Submitted', icon: '📋' },
  { key: 'verified', label: 'Enquiry Verified', icon: '✅' },
  { key: 'survey', label: 'Site Survey', icon: '🏠' },
  { key: 'quotation', label: 'Quotation Generated', icon: '💰' },
  { key: 'accepted', label: 'Quotation Accepted', icon: '🤝' },
  { key: 'order', label: 'Order Placed', icon: '📦' },
  { key: 'installation', label: 'Installation', icon: '⚡' },
  { key: 'completed', label: 'Project Completed', icon: '🎉' },
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
  padding: '28px 26px',
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

  // ─── Load Session ───────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sunpower_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.token) {
          setSession({
            token: parsed.token,
            fullName: parsed.fullName || parsed.name || 'Customer',
            email: parsed.email || '',
            phone: parsed.phone || '',
            customerId: parsed.customerId || null,
            userId: parsed.userId || parsed.id || null,
            roles: parsed.roles || ['ROLE_CUSTOMER'],
          });
        }
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
          token: data.token,
        };
        localStorage.setItem('sunpower_user', JSON.stringify(userData));

        // Also set in odoo_erp_user_session for api.ts compatibility
        try {
          const existing = localStorage.getItem('odoo_erp_user_session');
          const s = existing ? JSON.parse(existing) : {};
          s.token = data.token;
          localStorage.setItem('odoo_erp_user_session', JSON.stringify(s));
        } catch { /* ignore */ }

        setSession({
          token: data.token,
          fullName: data.user.fullName,
          email: data.user.email,
          phone: data.user.phone,
          customerId: data.user.customerId,
          userId: data.user.userId || data.user.id,
          roles: data.user.roles || ['ROLE_CUSTOMER'],
        });
      } else {
        setAuthError(data.message || 'Login failed.');
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
          token: data.token,
        };
        localStorage.setItem('sunpower_user', JSON.stringify(userData));

        try {
          const existing = localStorage.getItem('odoo_erp_user_session');
          const s = existing ? JSON.parse(existing) : {};
          s.token = data.token;
          localStorage.setItem('odoo_erp_user_session', JSON.stringify(s));
        } catch { /* ignore */ }

        setSession({
          token: data.token,
          fullName: data.user.fullName,
          email: data.user.email,
          phone: data.user.phone,
          customerId: data.user.customerId,
          userId: data.user.userId,
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
        alert('✅ Quotation accepted! A sales order has been created.');
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
            <p style={{ marginTop: '16px', color: '#64748b' }}>Loading...</p>
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
                    🔑 Sign In
                  </button>
                  <button type="button" onClick={() => { setAuthMode('register'); setAuthError(''); }}
                    style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer',
                      backgroundColor: authMode === 'register' ? '#e63a27' : '#f8fafc', color: authMode === 'register' ? '#fff' : '#64748b', }}>
                    📝 Create Account
                  </button>
                </div>

                {authError && (
                  <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: '20px' }}>
                    ⚠️ {authError}
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
                      {authLoading ? '⏳ Signing in...' : '🔓 Sign In to My Dashboard'}
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
                      {authLoading ? '⏳ Creating account...' : '🚀 Create Account & View Dashboard'}
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
                  🌞 Track your solar enquiry, view quotations from our sales team, accept proposals, and monitor your installation — all from your personal dashboard.
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

  // Tab config
  const tabs = [
    { key: 'overview', label: '📊 Overview', count: null },
    { key: 'enquiries', label: '📋 Enquiries', count: portalData?.enquiries?.length || 0 },
    { key: 'quotations', label: '💰 Quotations', count: portalData?.quotations?.length || 0 },
    { key: 'orders', label: '📦 Orders', count: portalData?.orders?.length || 0 },
    { key: 'support', label: '🛠️ Support', count: portalData?.serviceTickets?.length || 0 },
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
                    ✓ Verified Customer
                  </span>
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>
                    {session.email && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>📧 <span style={{ wordBreak: 'break-all' }}>{session.email}</span></div>}
                    {session.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>📱 {session.phone}</div>}
                    {portalData?.customer?.address && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>📍 {portalData.customer.address}, {portalData.customer.city}</div>}
                  </div>
                  <button type="button" onClick={handleLogout} style={{ width: '100%', marginTop: '16px', padding: '10px', borderRadius: '8px', border: '1.5px solid #fee2e2', backgroundColor: '#fff5f5', color: '#dc2626', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    🚪 Log Out
                  </button>
                </div>

                {/* Quick Actions */}
                <div style={cardStyle}>
                  <h5 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>Quick Actions</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Link href="/contact" style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#e63a27', color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
                      ☀️ Submit New Enquiry
                    </Link>
                    <Link href="/complaint" style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', textDecoration: 'none', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
                      🛠️ Raise Support Ticket
                    </Link>
                    <Link href="/service" style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', textDecoration: 'none', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
                      📦 View Solar Packages
                    </Link>
                  </div>
                </div>
              </div>

              {/* ═══ MAIN CONTENT ═══ */}
              <div className="col-12 col-lg-9">

                {/* Error Banner */}
                {error && (
                  <div style={{ padding: '14px 20px', borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: '20px' }}>
                    ⚠️ {error}
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
                        <div style={iconBoxStyle('#eff6ff', '#2563eb')}><i className="bi bi-graph-up-arrow" /></div>
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
                            <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '90px' }}>
                              <div style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{
                                  width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 6px auto',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                                  backgroundColor: isComplete ? '#ecfdf5' : isCurrent ? '#eff6ff' : '#f8fafc',
                                  border: `2px solid ${isComplete ? '#059669' : isCurrent ? '#2563eb' : '#e2e8f0'}`,
                                  boxShadow: isCurrent ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none',
                                }}>
                                  {isComplete ? '✅' : step.icon}
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
                          }}>
                          {tab.label} {tab.count !== null && tab.count > 0 && <span style={{ marginLeft: '4px', padding: '1px 6px', borderRadius: '9999px', backgroundColor: '#e63a27', color: '#fff', fontSize: '10px' }}>{tab.count}</span>}
                        </button>
                      ))}
                    </div>

                    {/* ═══ TAB: OVERVIEW ═══ */}
                    {activeTab === 'overview' && (
                      <>
                        {/* Summary Cards */}
                        <div className="row g-3" style={{ marginBottom: '24px' }}>
                          {[
                            { label: 'Enquiries', count: portalData.enquiries.length, icon: '📋', color: '#2563eb', bg: '#eff6ff' },
                            { label: 'Quotations', count: portalData.quotations.length, icon: '💰', color: '#059669', bg: '#ecfdf5' },
                            { label: 'Orders', count: portalData.orders.length, icon: '📦', color: '#ca8a04', bg: '#fefce8' },
                            { label: 'Installations', count: portalData.installations.length, icon: '⚡', color: '#dc2626', bg: '#fef2f2' },
                          ].map(item => (
                            <div key={item.label} className="col-6 col-md-3">
                              <div style={{ ...cardStyle, textAlign: 'center', marginBottom: 0, padding: '20px 12px' }}>
                                <div style={{ fontSize: '28px', marginBottom: '4px' }}>{item.icon}</div>
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
                              <div style={iconBoxStyle('#eff6ff', '#2563eb')}>📋</div>
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
                                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>✅ Your enquiry has been verified and accepted by our sales team!</span>
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
                              <div style={iconBoxStyle('#ecfdf5', '#059669')}>💰</div>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Latest Quotation from Sales Team</h4>
                                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Review and accept your solar system quotation</p>
                              </div>
                            </div>
                            {(() => {
                              const q = portalData.quotations[portalData.quotations.length - 1];
                              return (
                                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Quotation #{q.id}</div>
                                    <StatusBadge status={q.status} />
                                  </div>
                                  <div className="row g-2" style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
                                    <div className="col-6 col-md-3"><span style={{ fontWeight: 600 }}>System Size:</span><br/>{q.systemSize ? `${q.systemSize} kW` : '—'}</div>
                                    <div className="col-6 col-md-3"><span style={{ fontWeight: 600 }}>Total Amount:</span><br/><span style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>{formatCurrency(q.totalAmount)}</span></div>
                                    <div className="col-6 col-md-3"><span style={{ fontWeight: 600 }}>Discount:</span><br/>{q.discountPercent ? `${q.discountPercent}%` : '—'}</div>
                                    <div className="col-6 col-md-3"><span style={{ fontWeight: 600 }}>Final Amount:</span><br/><span style={{ fontWeight: 800, color: '#059669', fontSize: '15px' }}>{formatCurrency(q.finalAmount)}</span></div>
                                  </div>
                                  {q.validUntil && (
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                                      📅 Valid until: <strong>{formatDate(q.validUntil)}</strong>
                                    </div>
                                  )}
                                  {/* Line Items */}
                                  {q.items && q.items.length > 0 && (
                                    <div style={{ marginBottom: '14px' }}>
                                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Quotation Items</div>
                                      <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                                          <thead>
                                            <tr style={{ backgroundColor: '#f1f5f9' }}>
                                              <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Item</th>
                                              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Qty</th>
                                              <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Unit Price</th>
                                              <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Total</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {q.items.map((item: any, idx: number) => (
                                              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>{item.productName || `Item ${idx + 1}`}</td>
                                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.quantity}</td>
                                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.totalPrice)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                  {q.notes && <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', fontStyle: 'italic' }}>📝 {q.notes}</div>}
                                  {/* Accept Button */}
                                  {(q.status === 'SENT' || q.status === 'DRAFT') && (
                                    <button type="button" onClick={() => handleAcceptQuotation(q.id)}
                                      style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', backgroundColor: '#059669', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      🤝 Accept Quotation & Proceed
                                    </button>
                                  )}
                                  {q.status === 'ACCEPTED' && (
                                    <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>✅ You have accepted this quotation. A sales order has been created.</span>
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
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌞</div>
                            <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>No Enquiries Yet</h4>
                            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>Submit your first solar enquiry to get started. Our sales team will review and send you a quotation.</p>
                            <Link href="/contact" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: '10px', backgroundColor: '#e63a27', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>
                              ☀️ Submit Solar Enquiry
                            </Link>
                          </div>
                        )}
                      </>
                    )}

                    {/* ═══ TAB: ENQUIRIES ═══ */}
                    {activeTab === 'enquiries' && (
                      <div style={cardStyle}>
                        <div style={sectionHeaderStyle}>
                          <div style={iconBoxStyle('#eff6ff', '#2563eb')}>📋</div>
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
                                <div style={{ fontSize: '12px', color: '#475569' }}>
                                  {e.systemSize && <span style={{ marginRight: '16px' }}>🔋 {e.systemSize} kW</span>}
                                  {e.monthlyBill && <span style={{ marginRight: '16px' }}>💡 {formatCurrency(e.monthlyBill)}/mo</span>}
                                  {e.roofType && <span style={{ marginRight: '16px' }}>🏠 {e.roofType}</span>}
                                  <span>📅 {formatDate(e.createdAt)}</span>
                                </div>
                                {['CONTACTED', 'QUALIFIED', 'SURVEY_SCHEDULED', 'SURVEY_APPROVED', 'QUOTED', 'CONVERTED'].includes(e.status) && (
                                  <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700, color: '#059669' }}>✅ Verified & Accepted by Sales Team</div>
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
                          <div style={iconBoxStyle('#ecfdf5', '#059669')}>💰</div>
                          <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>All Quotations</h4>
                        </div>
                        {portalData.quotations.length === 0 ? (
                          <p style={{ color: '#64748b', fontSize: '14px' }}>No quotations yet. Once your enquiry is reviewed, our sales team will generate a quotation for you.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {portalData.quotations.map((q: any) => (
                              <div key={q.id} style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Quotation #{q.id}</span>
                                  <StatusBadge status={q.status} />
                                </div>
                                <div className="row g-2" style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                                  <div className="col-6 col-md-3"><strong>System:</strong><br/>{q.systemSize ? `${q.systemSize} kW` : '—'}</div>
                                  <div className="col-6 col-md-3"><strong>Total:</strong><br/><span style={{ fontWeight: 800, color: '#0f172a' }}>{formatCurrency(q.totalAmount)}</span></div>
                                  <div className="col-6 col-md-3"><strong>Discount:</strong><br/>{q.discountPercent ? `${q.discountPercent}%` : 'None'}</div>
                                  <div className="col-6 col-md-3"><strong>Final:</strong><br/><span style={{ fontWeight: 800, color: '#059669' }}>{formatCurrency(q.finalAmount)}</span></div>
                                </div>
                                {q.items && q.items.length > 0 && (
                                  <details style={{ marginBottom: '10px' }}>
                                    <summary style={{ cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>📄 View {q.items.length} Line Items</summary>
                                    <div style={{ marginTop: '8px', overflowX: 'auto' }}>
                                      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                                        <thead><tr style={{ backgroundColor: '#f1f5f9' }}>
                                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Item</th>
                                          <th style={{ padding: '6px 8px', textAlign: 'center' }}>Qty</th>
                                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>Unit Price</th>
                                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>Total</th>
                                        </tr></thead>
                                        <tbody>{q.items.map((item: any, idx: number) => (
                                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '6px 8px' }}>{item.productName || `Item ${idx + 1}`}</td>
                                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>{item.quantity}</td>
                                            <td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.totalPrice)}</td>
                                          </tr>
                                        ))}</tbody>
                                      </table>
                                    </div>
                                  </details>
                                )}
                                {q.validUntil && <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>📅 Valid until: {formatDate(q.validUntil)}</div>}
                                {(q.status === 'SENT' || q.status === 'DRAFT') && (
                                  <button type="button" onClick={() => handleAcceptQuotation(q.id)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#059669', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                                    🤝 Accept This Quotation
                                  </button>
                                )}
                                {q.status === 'ACCEPTED' && (
                                  <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: '12px', fontWeight: 700, color: '#059669' }}>
                                    ✅ Accepted — Sales order created
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ═══ TAB: ORDERS ═══ */}
                    {activeTab === 'orders' && (
                      <div style={cardStyle}>
                        <div style={sectionHeaderStyle}>
                          <div style={iconBoxStyle('#fefce8', '#ca8a04')}>📦</div>
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
                            <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>💳 Payment History</h5>
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
                              <div style={iconBoxStyle('#fef2f2', '#dc2626')}>⚡</div>
                              <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Installations</h4>
                            </div>
                            {portalData.installations.map((inst: any) => (
                              <div key={inst.id} style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <span style={{ fontWeight: 700, fontSize: '14px' }}>Installation #{inst.id}</span>
                                  <StatusBadge status={inst.status} />
                                </div>
                                <div style={{ fontSize: '12px', color: '#475569' }}>
                                  {inst.scheduledDate && <span>📅 Scheduled: {formatDate(inst.scheduledDate)} </span>}
                                  {inst.completedDate && <span> ✅ Completed: {formatDate(inst.completedDate)}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Warranties */}
                        {portalData.warranties.length > 0 && (
                          <div style={cardStyle}>
                            <div style={sectionHeaderStyle}>
                              <div style={iconBoxStyle('#ecfdf5', '#059669')}>🛡️</div>
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
                            <div style={iconBoxStyle('#fefce8', '#ca8a04')}>🛠️</div>
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
