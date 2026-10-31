'use client';

import React from 'react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '20px',
      }}
    >
      <div
        className="card shadow-lg p-4 p-md-5 text-center text-white"
        style={{
          maxWidth: '520px',
          width: '100%',
          borderRadius: '16px',
          background: 'rgba(30, 41, 59, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
            style={{ width: '64px', height: '64px', background: 'rgba(230, 58, 39, 0.15)', color: '#e63a27' }}
          >
            <i className="bi bi-shield-lock" style={{ fontSize: '32px' }}></i>
          </div>
          <h3 className="fw-bold text-white mb-2">SunPower Solutions</h3>
          <p className="text-secondary small mb-0">Public Customer Portal (Port 3000)</p>
        </div>

        <div className="alert alert-info text-start p-3 rounded-3 mb-4" style={{ fontSize: '13px' }}>
          <strong>Notice:</strong> This application is the public-facing Customer Portal for solar rooftop enquiries and project consultations.
          Internal staff accounts (Admin, Sales, Warehouse, Technician, Support, Finance) are strictly partitioned and managed inside the protected Internal ERP.
        </div>

        <div className="d-grid gap-3">
          <a
            href="http://localhost:5173/login"
            className="btn py-2 fw-semibold text-white shadow-sm"
            style={{ background: '#e63a27', borderRadius: '8px' }}
          >
            Go to Internal Staff ERP (Port 5173) <i className="bi bi-box-arrow-up-right ms-1"></i>
          </a>

          <Link href="/" className="btn btn-outline-light py-2" style={{ borderRadius: '8px' }}>
            <i className="bi bi-arrow-left me-1"></i> Return to Customer Home
          </Link>
        </div>
      </div>
    </div>
  );
}
