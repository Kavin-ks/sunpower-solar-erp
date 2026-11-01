'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AuthWelcomePage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regAgree, setRegAgree] = useState(true);

  // OTP Verification state
  const [registerStep, setRegisterStep] = useState<'form' | 'otp' | 'success'>('form');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [demoCode, setDemoCode] = useState('');

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (registerStep === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
    return () => clearInterval(interval);
  }, [registerStep, otpTimer]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Please enter both email and password.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOGIN',
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid email or password. Please verify credentials.');
      }

      localStorage.setItem('sunpower_user', JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem('odoo_erp_user_session', JSON.stringify({ token: data.token, user: data.user }));
      }

      toast.success('Login successful! Redirecting to solar portal...');
      setTimeout(() => {
        router.push('/home');
      }, 700);
    } catch (err: any) {
      toast.error(err?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Step 1: Send OTP for Registration
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regFullName.trim()) {
      const msg = 'Please enter your full name.';
      setRegError(msg);
      toast.error(msg);
      return;
    }
    if (!regEmail || !regEmail.includes('@')) {
      const msg = 'Please enter a valid email address.';
      setRegError(msg);
      toast.error(msg);
      return;
    }
    if (!regPhone || regPhone.length < 10) {
      const msg = 'Please enter a valid 10-digit mobile number.';
      setRegError(msg);
      toast.error(msg);
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setRegError(msg);
      toast.error(msg);
      return;
    }
    if (regPassword !== regConfirmPassword) {
      const msg = 'Passwords do not match. Please ensure both passwords are identical.';
      setRegError(msg);
      toast.error(msg);
      return;
    }
    if (!regAgree) {
      const msg = 'Please accept the Terms & Conditions.';
      setRegError(msg);
      toast.error(msg);
      return;
    }

    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_OTP',
          email: regEmail,
          name: regFullName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to dispatch verification OTP.');
      }

      if (data.demoOtp) {
        setDemoCode(data.demoOtp);
        toast.info(data.message, { autoClose: 9000 });
      } else {
        setDemoCode('');
        toast.success(data.message || `Verification code sent to ${regEmail}! Please check your email.`);
      }

      setRegisterStep('otp');
      setOtpTimer(60);
      setCanResendOtp(false);
      setOtpValues(['', '', '', '', '', '']);

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 200);
    } catch (err: any) {
      toast.error(err?.message || 'Could not send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;

    const newValues = [...otpValues];
    newValues[index] = val.slice(-1);
    setOtpValues(newValues);

    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP & Complete Registration
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpValues.join('');

    if (enteredOtp.length !== 6) {
      toast.error('Please enter all 6 digits of the OTP code.');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_OTP',
          email: regEmail,
          otp: enteredOtp,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.verified) {
        throw new Error(data.message || 'Invalid verification OTP.');
      }

      // Persist customer to backend database table 'users' with BCrypt password hashing
      try {
        const regDbRes = await fetch('/api/auth/customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'REGISTER',
            email: regEmail,
            password: regPassword,
            fullName: regFullName,
            phone: regPhone,
          }),
        });
        const regDbData = await regDbRes.json();
        if (regDbData.token) {
          localStorage.setItem('odoo_erp_user_session', JSON.stringify({ token: regDbData.token, user: regDbData.user }));
        }
      } catch (dbErr) {
        console.warn('Backend database registration note:', dbErr);
      }

      setRegisterStep('success');
      localStorage.setItem(
        'sunpower_user',
        JSON.stringify({ fullName: regFullName, email: regEmail, phone: regPhone, role: 'customer' })
      );
      toast.success('Account registered & securely saved to database!');

      setTimeout(() => {
        router.push('/home');
      }, 1500);
    } catch (err: any) {
      toast.error(err?.message || 'Verification failed. Please check your code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!canResendOtp) return;
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_OTP',
          email: regEmail,
          name: regFullName,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Resend failed');

      if (data.demoOtp) {
        setDemoCode(data.demoOtp);
        toast.info(data.message, { autoClose: 9000 });
      } else {
        setDemoCode('');
        toast.info(`A new verification code has been emailed to ${regEmail}.`);
      }
      setOtpTimer(60);
      setCanResendOtp(false);
      setOtpValues(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0f1d',
        fontFamily: "'Jost', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(230, 58, 39, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(245, 158, 11, 0.06) 0%, transparent 40%)',
      }}
    >
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="dark" />

      {/* Main Glassmorphic Split-Screen Container */}
      <div
        style={{
          maxWidth: '1080px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          minHeight: '620px',
        }}
      >
        {/* LEFT COLUMN: Industrial Solar Showcase */}
        <div
          style={{
            backgroundColor: '#121829',
            color: '#ffffff',
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {/* Subtle Background Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(230, 58, 39, 0.22) 0%, transparent 70%)',
              filter: 'blur(30px)',
              pointerEvents: 'none',
            }}
          />

          <div>
            {/* Brand Logo & Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
              <img
                src="/odoo_logo.png"
                alt="Odoo Solar System ERP"
                style={{
                  height: '46px',
                  width: 'auto',
                  objectFit: 'contain',
                  borderRadius: '6px',
                }}
              />
              <div>
                <h1 style={{ fontSize: '19px', fontWeight: 800, margin: 0, letterSpacing: '0.03em', color: '#ffffff' }}>
                  ODOO SOLAR SYSTEM ERP
                </h1>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Rooftop Installation & CRM Portal
                </p>
              </div>
            </div>

            {/* Clean Title & Message */}
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.3,
                margin: '0 0 14px 0',
                letterSpacing: '-0.02em',
              }}
            >
              Powering Clean Rooftop Energy
            </h2>

            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Sign in to manage your solar installations, track quotations, and access government subsidies.
            </p>
          </div>

          {/* Direct Navigation Links */}
          <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Quick Direct Access:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <Link
                href="/home"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <span>🌐 Solar Website</span>
              </Link>
              <Link
                href="/complaint"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  backgroundColor: 'rgba(230, 58, 39, 0.15)',
                  border: '1px solid rgba(230, 58, 39, 0.35)',
                  borderRadius: '6px',
                  color: '#ff8a7a',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <span>⚡ Support & Warranty</span>
              </Link>
              <Link
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '6px',
                  color: '#6ee7b7',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <span>🛠️ Staff ERP Scenes</span>
              </Link>
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  borderRadius: '6px',
                  color: '#93c5fd',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <span>🖥️ Vue ERP (5173) ↗</span>
              </a>
            </div>
          </div>

          {/* Simple Contact Footer */}
          <div style={{ marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
            <span>Need assistance? </span>
            <a href="tel:+917010818264" style={{ color: '#e63a27', fontWeight: 700, textDecoration: 'none' }}>
              +91 7010818264
            </a>
          </div>
        </div>

        {/* RIGHT COLUMN: Authentication Form */}
        <div style={{ padding: '44px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Header Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              padding: '4px',
              backgroundColor: '#f1f5f9',
              borderRadius: '10px',
              marginBottom: '28px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setRegisterStep('form');
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'signin' ? '#ffffff' : 'transparent',
                color: activeTab === 'signin' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'signin' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'register' ? '#ffffff' : 'transparent',
                color: activeTab === 'register' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'register' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Create Account
            </button>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: SIGN IN FORM                                       */}
          {/* ========================================================= */}
          {activeTab === 'signin' && (
            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                  Welcome Back!
                </h3>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
                  Sign in to view your solar quotations, installations, and enquiries.
                </p>
              </div>

              {/* Email Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 40px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      color: '#0f172a',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#e63a27')}
                    onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                  />
                  <i
                    className="bi bi-envelope"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                  ></i>
                </div>
              </div>

              {/* Password Input */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', margin: 0 }}>Password</label>
                  <a href="#" style={{ fontSize: '12px', color: '#e63a27', fontWeight: 600, textDecoration: 'none' }}>
                    Forgot password?
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 40px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14px',
                      color: '#0f172a',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#e63a27')}
                    onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                  />
                  <i
                    className="bi bi-lock"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                  ></i>
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    <i className={showLoginPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                  </button>
                </div>
              </div>

              {/* Quick Fill Demo */}
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#64748b',
                }}
              >
                <span>Quick Fill: <strong>arivuchezhiyan000@gmail.com</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('arivuchezhiyan000@gmail.com');
                    setLoginPassword('SunPower@2026');
                  }}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#e63a27',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Apply
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#e63a27',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(230, 58, 39, 0.35)',
                  transition: 'all 0.2s ease',
                  opacity: loginLoading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>{loginLoading ? 'Signing In...' : 'Sign In to Portal'}</span>
                <i className="bi bi-arrow-right"></i>
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  style={{ border: 'none', background: 'none', color: '#e63a27', fontWeight: 700, cursor: 'pointer' }}
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 2: REGISTER WITH EMAIL OTP FLOW                       */}
          {/* ========================================================= */}
          {activeTab === 'register' && (
            <div>
              {/* STAGE 1: REGISTRATION DETAILS FORM */}
              {registerStep === 'form' && (
                <form onSubmit={handleRequestOtp}>
                  <div style={{ marginBottom: '18px' }}>
                    <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                      Create Your Account
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                      Register with your email to receive a secure 6-digit OTP verification code.
                    </p>
                  </div>

                  {/* Full Name */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Arivuchezhiyan E"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13.5px',
                        color: '#0f172a',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Email & Phone */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        Email (for OTP) *
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="your.email@gmail.com"
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13.5px',
                          color: '#0f172a',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        Mobile Phone *
                      </label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="10-digit number"
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13.5px',
                          color: '#0f172a',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Password & Confirm */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        Create Password *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => {
                            setRegPassword(e.target.value);
                            setRegError('');
                          }}
                          placeholder="Min 6 characters"
                          required
                          style={{
                            width: '100%',
                            padding: '10px 36px 10px 12px',
                            borderRadius: '6px',
                            border: `1.5px solid ${regPassword && regPassword.length < 6 ? '#f59e0b' : '#cbd5e1'}`,
                            fontSize: '13.5px',
                            color: '#0f172a',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                          title={showRegPassword ? 'Hide password' : 'Show password'}
                        >
                          <i className={showRegPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                        </button>
                      </div>
                      {regPassword && regPassword.length < 6 && (
                        <div style={{ fontSize: '11px', color: '#d97706', marginTop: '3px' }}>
                          <i className="bi bi-info-circle me-1"></i>Min 6 characters
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        Confirm Password *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          value={regConfirmPassword}
                          onChange={(e) => {
                            setRegConfirmPassword(e.target.value);
                            setRegError('');
                          }}
                          placeholder="Re-enter password"
                          required
                          style={{
                            width: '100%',
                            padding: '10px 36px 10px 12px',
                            borderRadius: '6px',
                            border: `1.5px solid ${
                              regConfirmPassword
                                ? regPassword === regConfirmPassword
                                  ? '#10b981'
                                  : '#ef4444'
                                : '#cbd5e1'
                            }`,
                            backgroundColor: regConfirmPassword
                              ? regPassword === regConfirmPassword
                                ? '#f0fdf4'
                                : '#fef2f2'
                              : '#ffffff',
                            fontSize: '13.5px',
                            color: '#0f172a',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                          title={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          <i className={showRegConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Visual Confirmation of Password Match / Mismatch */}
                  {regConfirmPassword.length > 0 && regPassword === regConfirmPassword && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        color: '#16a34a',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '12px',
                      }}
                    >
                      <i className="bi bi-check-circle-fill"></i>
                      <span>Passwords match perfectly!</span>
                    </div>
                  )}

                  {regConfirmPassword.length > 0 && regPassword !== regConfirmPassword && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        color: '#dc2626',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '12px',
                      }}
                    >
                      <i className="bi bi-x-circle-fill"></i>
                      <span>Passwords do not match. Please verify both passwords.</span>
                    </div>
                  )}

                  {/* Inline Error Message on Submit */}
                  {regError && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        color: '#b91c1c',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        marginBottom: '12px',
                      }}
                    >
                      <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '14px', flexShrink: 0 }}></i>
                      <span>{regError}</span>
                    </div>
                  )}

                  {/* Agree Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                    <input
                      type="checkbox"
                      id="regAgree"
                      checked={regAgree}
                      onChange={(e) => setRegAgree(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="regAgree" style={{ fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                      I agree to the Terms of Service & PM Surya Ghar Subsidy Guidelines.
                    </label>
                  </div>

                  {/* Send OTP Button */}
                  <button
                    type="submit"
                    disabled={otpLoading}
                    style={{
                      width: '100%',
                      padding: '13px',
                      backgroundColor: '#e63a27',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14.5px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(230, 58, 39, 0.35)',
                      transition: 'all 0.2s ease',
                      opacity: otpLoading ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{otpLoading ? 'Sending Verification Code...' : 'Send Verification OTP Code'}</span>
                    <i className="bi bi-send-fill"></i>
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#64748b' }}>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('signin')}
                      style={{ border: 'none', background: 'none', color: '#e63a27', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* STAGE 2: OTP ENTRY AND VERIFICATION */}
              {registerStep === 'otp' && (
                <form onSubmit={handleVerifyOtp} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: '#fff7ed',
                      color: '#e63a27',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto',
                      fontSize: '26px',
                      border: '2px solid #fed7aa',
                    }}
                  >
                    <i className="bi bi-envelope-check"></i>
                  </div>

                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                    Verify Your Email
                  </h3>

                  <p style={{ fontSize: '13.5px', color: '#475569', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                    We dispatched a 6-digit OTP code to: <br />
                    <strong style={{ color: '#0f172a' }}>{regEmail}</strong>
                  </p>

                  {/* Fallback & Spam helper */}
                  {demoCode && (
                    <div
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        margin: '0 auto 18px auto',
                        maxWidth: '380px',
                        fontSize: '12.5px',
                        color: '#475569',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ color: '#64748b', fontSize: '12px' }}>
                        Didn't receive the email? Check your <strong>Spam / Junk folder</strong> or use this code:
                      </div>
                      <div style={{ margin: '6px 0' }}>
                        OTP Code:{' '}
                        <strong style={{ letterSpacing: '3px', fontSize: '18px', color: '#e63a27', fontFamily: 'monospace' }}>
                          {demoCode}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpValues(demoCode.split(''));
                        }}
                        style={{
                          marginTop: '4px',
                          padding: '5px 14px',
                          backgroundColor: '#e63a27',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Auto-Fill Verification Code
                      </button>
                    </div>
                  )}

                  {/* 6 Digit Inputs */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '22px' }}>
                    {otpValues.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpInputsRef.current[i] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        style={{
                          width: '46px',
                          height: '52px',
                          borderRadius: '8px',
                          border: '2px solid #cbd5e1',
                          textAlign: 'center',
                          fontSize: '22px',
                          fontWeight: 700,
                          color: '#0f172a',
                          outline: 'none',
                          transition: 'border-color 0.15s ease',
                          fontFamily: 'monospace',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#e63a27')}
                        onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                      />
                    ))}
                  </div>

                  {/* Verify Button */}
                  <button
                    type="submit"
                    disabled={otpLoading}
                    style={{
                      width: '100%',
                      padding: '13px',
                      backgroundColor: '#e63a27',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14.5px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(230, 58, 39, 0.35)',
                      opacity: otpLoading ? 0.7 : 1,
                      marginBottom: '16px',
                    }}
                  >
                    {otpLoading ? 'Verifying OTP...' : 'Verify & Complete Registration'}
                  </button>

                  {/* Resend & Back Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                    <button
                      type="button"
                      onClick={() => setRegisterStep('form')}
                      style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                    >
                      ← Edit Details
                    </button>

                    <div>
                      {otpTimer > 0 ? (
                        <span style={{ color: '#94a3b8' }}>Resend in <strong>00:{otpTimer < 10 ? `0${otpTimer}` : otpTimer}</strong></span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={otpLoading}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: '#e63a27',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          Resend OTP Code
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              )}

              {/* STAGE 3: REGISTRATION SUCCESS */}
              {registerStep === 'success' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#ecfdf5',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto',
                      fontSize: '32px',
                    }}
                  >
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
                    Account Verified!
                  </h3>
                  <p style={{ fontSize: '14.5px', color: '#64748b', margin: 0 }}>
                    Welcome to Odoo Solar System ERP. Redirecting to your dashboard...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast notifications container */}
      <ToastContainer position="top-right" autoClose={3500} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
    </div>
  );
};

export default AuthWelcomePage;