'use client';

import React, { useEffect } from 'react';

interface EnquirySuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiryNumber?: string;
  customerName?: string;
}

const EnquirySuccessModal: React.FC<EnquirySuccessModalProps> = ({
  isOpen,
  onClose,
  customerName,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(10, 18, 30, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        fontFamily: "'Jost', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          position: 'relative',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.5)',
          padding: '36px 32px 30px',
          textAlign: 'center',
          animation: 'modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
            lineHeight: 1,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#141422')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          ✕
        </button>

        {/* Clean Success Icon */}
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
            margin: '0 auto 20px auto',
            fontSize: '32px',
          }}
        >
          <i className="bi bi-check-circle-fill"></i>
        </div>

        {/* Main Heading */}
        <h3
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#141422',
            margin: '0 0 10px 0',
            letterSpacing: '-0.01em',
          }}
        >
          Thanks for Choosing Us!
        </h3>

        {/* Subtitle Message */}
        <p
          style={{
            fontSize: '16px',
            color: '#475569',
            margin: '0 0 28px 0',
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          Our team will contact you within 24hr.
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          type="button"
          style={{
            width: '100%',
            padding: '14px 24px',
            backgroundColor: '#e63a27',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(230, 58, 39, 0.35)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#cf3120';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(230, 58, 39, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#e63a27';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(230, 58, 39, 0.35)';
          }}
        >
          OK
        </button>
      </div>

      <style jsx global>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default EnquirySuccessModal;
