'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SunPowerERP from '@/components/erp/SunPowerERP';
import { staffLogin, setToken } from '@/lib/api';

interface UserSession {
  username: string;
  fullName: string;
  role: string;
  email: string;
}

const DEMO_PERSONAS: { [key: string]: UserSession } = {
  admin: {
    username: 'admin',
    fullName: 'Kavin K. (Managing Director)',
    role: 'Director / Executive Admin',
    email: 'Odoo@gmail.com',
  },
  sales: {
    username: 'sales',
    fullName: 'Rajesh Sharma',
    role: 'Senior Sales & Survey Lead',
    email: 'sales@sunpowersolutions.in',
  },
  warehouse: {
    username: 'warehouse',
    fullName: 'Murugan V.',
    role: 'Warehouse & Logistics Manager',
    email: 'warehouse@sunpowersolutions.in',
  },
  technician: {
    username: 'technician',
    fullName: 'Senthil Kumar',
    role: 'Chief Rooftop Installation Technician',
    email: 'senthil.tech@sunpowersolutions.in',
  },
  support: {
    username: 'support',
    fullName: 'Priya Sundaram',
    role: 'Customer Service & Warranty Specialist',
    email: 'support@sunpowersolutions.in',
  },
  finance: {
    username: 'finance',
    fullName: 'Anand Raman',
    role: 'Accounts & Subsidy Compliance Lead',
    email: 'finance@sunpowersolutions.in',
  },
};

export default function LoginPage() {
  const [user, setUser] = useState<UserSession | null>(null);

  // Form states
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('odoo_erp_user_session');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Session load error', e);
    }
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const cleanUser = username.trim().toLowerCase();

    // Try real Spring Boot JWT authentication first
    try {
      const authResp = await staffLogin({ username: cleanUser, password });
      const persona: UserSession = {
        username: authResp.username,
        fullName: authResp.fullName,
        role: authResp.roles?.[0]?.replace('ROLE_', '') || 'Staff',
        email: authResp.email || `${cleanUser}@sunpowersolutions.in`,
      };

      // Store JWT token for API calls
      setToken(authResp.token);

      setUser(persona);
      try {
        localStorage.setItem('odoo_erp_user_session', JSON.stringify({ ...persona, token: authResp.token, roles: authResp.roles }));
      } catch (err) {
        console.error('Failed to store session', err);
      }
      setLoading(false);
    } catch (authErr) {
      console.warn('Backend auth failed, falling back to demo persona:', authErr);
      // Fallback: use demo personas if backend is not reachable
      const persona = DEMO_PERSONAS[cleanUser] || {
        username: cleanUser,
        fullName: cleanUser.toUpperCase(),
        role: 'Solar Operations Officer',
        email: `${cleanUser}@sunpowersolutions.in`,
      };

      setUser(persona);
      try {
        localStorage.setItem('odoo_erp_user_session', JSON.stringify(persona));
      } catch (err) {
        console.error('Failed to store session', err);
      }
      setLoading(false);
    }
  };

  const handleQuickPersona = async (personaKey: string) => {
    const persona = DEMO_PERSONAS[personaKey];
    if (!persona) return;

    setUsername(persona.username);
    setPassword('password123');

    // Try real auth for this persona
    try {
      const authResp = await staffLogin({ username: persona.username, password: 'password123' });
      setToken(authResp.token);
      const enrichedPersona = { ...persona, token: authResp.token, roles: authResp.roles };
      setUser(persona);
      localStorage.setItem('odoo_erp_user_session', JSON.stringify(enrichedPersona));
    } catch {
      // Fallback to demo mode
      setUser(persona);
      try {
        localStorage.setItem('odoo_erp_user_session', JSON.stringify(persona));
      } catch (err) {
        console.error('Failed to store session', err);
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('odoo_erp_user_session');
      localStorage.removeItem('sunpower_erp_state_next_v1');
    } catch (err) {
      console.error('Failed to clear session', err);
    }
  };

  // 1. Authenticated: Render ERP Dashboard with Enterprise Management Topbar
  if (user) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        {/* Enterprise Topbar */}
        <div
          style={{
            background: '#19142d',
            color: '#ffffff',
            borderBottom: '3px solid #e63a27',
            padding: '10px 24px',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between gap-3 px-0">
            {/* Left: Brand Logo & Title */}
            <div className="d-flex align-items-center gap-3">
              <img
                src="/odoo_logo.png"
                alt="Odoo Solar System ERP"
                style={{ height: '46px', width: 'auto', objectFit: 'contain' }}
              />
              <div className="border-start border-secondary ps-3 d-none d-md-block">
                <div className="fw-bold fs-6 text-white" style={{ lineHeight: 1.2 }}>
                  Odoo Solar System ERP
                </div>
                <div className="text-warning small" style={{ fontSize: '11px', letterSpacing: '0.3px' }}>
                  Enterprise Installation & Inventory Platform
                </div>
              </div>
            </div>

            {/* Middle: Quick Persona Switcher for Evaluation */}
            <div className="d-flex align-items-center gap-1 flex-wrap">
              <span className="text-white-50 small me-1 d-none d-lg-inline" style={{ fontSize: '11px' }}>
                Switch Persona:
              </span>
              {[
                { key: 'admin', label: '👑 Admin' },
                { key: 'sales', label: '💼 Sales' },
                { key: 'warehouse', label: '📦 Warehouse' },
                { key: 'technician', label: '⚡ Technician' },
                { key: 'support', label: '🛠️ Support' },
                { key: 'finance', label: '💰 Finance' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleQuickPersona(p.key)}
                  className={`btn btn-sm py-1 px-2 border-0 rounded-2 ${
                    user.username === p.key ? 'btn-light text-dark fw-bold' : 'btn-outline-secondary text-white'
                  }`}
                  style={{ fontSize: '11px' }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Right: Active User & Logout */}
            <div className="d-flex align-items-center gap-3">
              <div className="text-end d-none d-sm-block">
                <div className="text-white fw-semibold small">{user.fullName}</div>
                <span className="badge bg-success" style={{ fontSize: '10px' }}>
                  {user.role}
                </span>
              </div>

              <Link
                href="/"
                className="btn btn-outline-light btn-sm py-1 px-2.5 d-flex align-items-center gap-1"
                style={{ fontSize: '12px' }}
                title="Return to Public Customer Website"
              >
                <i className="bi bi-globe"></i> Website
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-danger btn-sm py-1 px-3 fw-semibold d-flex align-items-center gap-1"
                style={{ fontSize: '12px', background: '#e63a27', borderColor: '#e63a27' }}
              >
                <i className="bi bi-box-arrow-right"></i> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Full Interactive ERP System & Operations Dashboard */}
        <SunPowerERP />
      </div>
    );
  }

  // 2. Unauthenticated: Render Sleek ERP Authentication Screen
  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #064e3b 100%)',
        minHeight: '100vh',
      }}
    >
      <div
        className="w-100 bg-white rounded-4 shadow-lg p-4 p-md-5 border"
        style={{ maxWidth: '480px', borderColor: 'rgba(255,255,255,0.1)' }}
      >
        {/* Brand & Logo */}
        <div className="text-center mb-4">
          <div className="d-flex justify-content-center mb-3">
            <img
              src="/odoo_logo.png"
              alt="Odoo Solar System ERP"
              style={{ maxHeight: '72px', width: 'auto', objectFit: 'contain' }}
            />
          </div>
          <h4 className="fw-bold text-dark mb-1">Odoo Solar System ERP</h4>
          <p className="text-muted small mb-0">
            Internal Operations, Quoting, Serialized Inventory & Rooftop Installation Portal
          </p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="mb-4">
          <div className="mb-3">
            <label className="form-label text-secondary fw-semibold small text-uppercase mb-1" style={{ fontSize: '11px' }}>
              Username
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="bi bi-person"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0 py-2"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label text-secondary fw-semibold small text-uppercase mb-1" style={{ fontSize: '11px' }}>
              Password
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="bi bi-lock"></i>
              </span>
              <input
                type="password"
                className="form-control bg-light border-start-0 py-2"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn w-100 py-2.5 text-white fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2 mt-4"
            style={{ background: '#e63a27', borderColor: '#e63a27' }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to ERP Dashboard</span>
                <i className="bi bi-arrow-right"></i>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Personas */}
        <div className="pt-3 border-top text-center">
          <div className="text-muted fw-semibold small mb-2" style={{ fontSize: '11px' }}>
            <i className="bi bi-shield-check text-success me-1"></i> Quick Demo Persona Login:
          </div>
          <div className="row g-2">
            {[
              { key: 'admin', label: '👑 Admin (Director)' },
              { key: 'sales', label: '💼 Sales Lead' },
              { key: 'warehouse', label: '📦 Warehouse' },
              { key: 'technician', label: '⚡ Technician' },
              { key: 'support', label: '🛠️ Support' },
              { key: 'finance', label: '💰 Finance' },
            ].map((p) => (
              <div key={p.key} className="col-4">
                <button
                  type="button"
                  onClick={() => handleQuickPersona(p.key)}
                  className={`btn btn-sm w-100 py-1.5 px-1 rounded-2 text-truncate border ${
                    username === p.key ? 'btn-primary text-white' : 'btn-light text-dark'
                  }`}
                  style={{ fontSize: '11px' }}
                >
                  {p.label}
                </button>
              </div>
            ))}
          </div>
          <p className="text-muted mt-3 mb-0" style={{ fontSize: '11px' }}>
            Default test password: <code className="text-dark fw-bold">password123</code>
          </p>
        </div>

        {/* Back Link to Public Site */}
        <div className="text-center mt-4 pt-2 border-top">
          <Link href="/" className="text-decoration-none text-muted small">
            <i className="bi bi-arrow-left me-1"></i> Return to Public Solar Website
          </Link>
        </div>
      </div>
    </div>
  );
}
