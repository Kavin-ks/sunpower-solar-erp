'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface UserData {
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  token?: string;
}

const UserProfileDropdown: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check sunpower_user session (customer portal session)
    const storedUser = localStorage.getItem('sunpower_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setIsLoggedIn(!!parsed.token);
      } catch (e) {
        setUser(null);
        setIsLoggedIn(false);
      }
    }
  }, []);

  // If not logged in, show a "Login" button
  if (!isLoggedIn) {
    return (
      <Link
        href="/profile"
        title="Customer Login"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 14px 5px 10px',
          backgroundColor: '#e63a27',
          border: '1.5px solid #e63a27',
          borderRadius: '9999px',
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(230, 58, 39, 0.3)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#c93020';
          e.currentTarget.style.borderColor = '#c93020';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#e63a27';
          e.currentTarget.style.borderColor = '#e63a27';
        }}
      >
        <i className="bi bi-person-circle" style={{ fontSize: '16px', color: '#ffffff' }} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
          My Account
        </span>
      </Link>
    );
  }

  const displayName = user?.fullName || user?.name || 'Customer';
  const firstName = displayName.split(' ')[0] || 'Profile';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'CU';

  return (
    <Link
      href="/profile"
      title="View My Dashboard"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '5px 12px 5px 6px',
        backgroundColor: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '9999px',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#e63a27';
        e.currentTarget.style.backgroundColor = '#fff5f3';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e2e8f0';
        e.currentTarget.style.backgroundColor = '#ffffff';
      }}
    >
      {/* Circular Avatar */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#e63a27',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '0.04em',
          boxShadow: '0 2px 6px rgba(230, 58, 39, 0.3)',
        }}
      >
        {initials}
      </div>

      <span
        style={{
          fontSize: '13.5px',
          fontWeight: 600,
          color: '#1e293b',
          maxWidth: '120px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {firstName}
      </span>

      <i className="bi bi-grid-fill" style={{ fontSize: '12px', color: '#64748b' }} />
    </Link>
  );
};

export default UserProfileDropdown;
