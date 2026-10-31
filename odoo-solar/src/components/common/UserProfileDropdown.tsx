'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface UserData {
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

const UserProfileDropdown: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('sunpower_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser({ fullName: 'Arivuchezhiyan E', email: 'arivuchezhiyan000@gmail.com', phone: '7010818264' });
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

  const displayName = user?.fullName || user?.name || 'Customer Account';
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
      title="View My Profile"
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
      {/* Circular Avatar without ANY dot */}
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

      <i className="bi bi-person-fill" style={{ fontSize: '13px', color: '#64748b' }}></i>
    </Link>
  );
};

export default UserProfileDropdown;
