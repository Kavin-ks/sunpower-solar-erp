'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HeaderOne from '@/layouts/headers/HeaderOne';
import FooterOne from '@/layouts/footers/FooterOne';
import Breadcrumb from '@/components/common/breadcrumb/breadcrumb';

interface UserData {
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

const ProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('sunpower_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser({
          fullName: 'Arivuchezhiyan E',
          email: 'arivuchezhiyan000@gmail.com',
          phone: '7010818264',
          role: 'Verified Customer',
        });
      }
    } else {
      setUser({
        fullName: 'Arivuchezhiyan E',
        email: 'arivuchezhiyan000@gmail.com',
        phone: '7010818264',
        role: 'Verified Customer',
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sunpower_user');
    router.push('/');
  };

  const displayName = user?.fullName || user?.name || 'Arivuchezhiyan E';
  const displayEmail = user?.email || 'arivuchezhiyan000@gmail.com';
  const displayPhone = user?.phone || '+91 7010818264';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AE';

  return (
    <>
      <HeaderOne />
      <main>
        {/* Breadcrumb Header */}
        <Breadcrumb top_title="My Profile" title="Customer Account" />

        {/* Profile Content Section */}
        <div style={{ backgroundColor: '#f8fafc', padding: '60px 0 80px 0', fontFamily: "'Jost', sans-serif" }}>
          <div className="container">
            <div className="row g-4">
              
              {/* LEFT COLUMN: User Summary & Logout */}
              <div className="col-12 col-lg-4">
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '36px 28px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center',
                  }}
                >
                  {/* Large Avatar Circle without any online dot */}
                  <div
                    style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      backgroundColor: '#e63a27',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '32px',
                      margin: '0 auto 18px auto',
                      boxShadow: '0 8px 24px rgba(230, 58, 39, 0.35)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {initials}
                  </div>

                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                    {displayName}
                  </h3>

                  <div style={{ marginBottom: '18px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      ✓ Verified Customer
                    </span>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '20px',
                      marginBottom: '26px',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      fontSize: '14px',
                      color: '#475569',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="bi bi-envelope text-muted fs-5"></i>
                      <span style={{ wordBreak: 'break-all' }}>{displayEmail}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="bi bi-telephone text-muted fs-5"></i>
                      <span>{displayPhone}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="bi bi-geo-alt text-muted fs-5"></i>
                      <span>Chennai, Tamil Nadu</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="bi bi-shield-check text-success fs-5"></i>
                      <span>Google Apps Script OTP Verified</span>
                    </div>
                  </div>

                  {/* Prominent Red Logout Button */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: '10px',
                      border: '1.5px solid #fee2e2',
                      backgroundColor: '#fff5f5',
                      color: '#dc2626',
                      fontSize: '15px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.borderColor = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff5f5';
                      e.currentTarget.style.color = '#dc2626';
                      e.currentTarget.style.borderColor = '#fee2e2';
                    }}
                  >
                    <i className="bi bi-box-arrow-right fs-5"></i>
                    <span>Log Out of Account</span>
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: Account & Solar Management Details */}
              <div className="col-12 col-lg-8">
                {/* Card 1: Account Information Details */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '32px 30px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e2e8f0',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: '#fff7ed',
                        color: '#ea580c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                      }}
                    >
                      <i className="bi bi-person-lines-fill"></i>
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                        Customer Profile Information
                      </h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Entered credentials and authentication status
                      </p>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
                          Full Name
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                          {displayName}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
                          Registered Email
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '2px', wordBreak: 'break-all' }}>
                          {displayEmail}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
                          Mobile Number
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                          {displayPhone}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
                          Account Status
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#059669', marginTop: '2px' }}>
                          Active & OTP Verified
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Solar System & Subsidy Benefits */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '32px 30px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e2e8f0',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                      }}
                    >
                      <i className="bi bi-sun-fill"></i>
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                        Solar Project & Subsidy Eligibility
                      </h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Turnkey benefits linked to your customer profile
                      </p>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', color: '#e63a27', marginBottom: '4px' }}>
                          <i className="bi bi-clock-history"></i>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>24-Hour Callback</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>SLA Guaranteed Service</div>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', color: '#2563eb', marginBottom: '4px' }}>
                          <i className="bi bi-cash-stack"></i>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>PM Surya Ghar</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>Up to ₹78,000 Subsidy</div>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', color: '#059669', marginBottom: '4px' }}>
                          <i className="bi bi-shield-check"></i>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>20-Year Warranty</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>Serialized Hardware</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Navigation Action Buttons */}
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <Link
                    href="/contact"
                    className="btn text-white fw-bold d-inline-flex align-items-center gap-2 px-4 py-3"
                    style={{
                      backgroundColor: '#e63a27',
                      borderRadius: '8px',
                      fontSize: '14px',
                      textDecoration: 'none',
                    }}
                  >
                    <span>Submit Rooftop Enquiry</span>
                    <i className="bi bi-arrow-right"></i>
                  </Link>

                  <Link
                    href="/service"
                    className="btn btn-outline-secondary fw-bold d-inline-flex align-items-center gap-2 px-4 py-3"
                    style={{
                      borderRadius: '8px',
                      fontSize: '14px',
                      textDecoration: 'none',
                    }}
                  >
                    <span>View 1kW–5kW Packages</span>
                  </Link>

                  <Link
                    href="/home"
                    className="btn btn-light fw-bold d-inline-flex align-items-center gap-2 px-4 py-3 border"
                    style={{
                      borderRadius: '8px',
                      fontSize: '14px',
                      textDecoration: 'none',
                    }}
                  >
                    <span>Back to Home</span>
                  </Link>
                </div>
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
