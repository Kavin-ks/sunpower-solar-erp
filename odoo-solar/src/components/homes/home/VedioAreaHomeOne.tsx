'use client';

import React, { useState, useEffect } from 'react';

const VedioAreaHomeOne = ({ style }: any) => {
  const [isVideoOpen, setIsVideoOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsVideoOpen(false);
    };

    if (isVideoOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVideoOpen]);

  return (
    <>
      {/* Video Banner Section — Kept exact same thumbnail background and structure */}
      <div className={`call-do-action-section ${style ? 'style-two' : ''}`}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="single-video text-center wow animate__bounceInDown">
                <div className="video-icon">
                  <a
                    className="video-vemo-icon venobox vbox-item"
                    onClick={() => setIsVideoOpen(true)}
                    style={{ cursor: 'pointer' }}
                    aria-label="Play Solar Video"
                  >
                    <i className="bi bi-play"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HTML5 Modal Video Player for gemini_generated_video_a09cdd69.mp4 */}
      {isVideoOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '20px',
            animation: 'fadeInVideo 0.25s ease-out forwards',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsVideoOpen(false);
          }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '960px',
              width: '100%',
              backgroundColor: '#000000',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.15)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Close Button (X) */}
            <button
              onClick={() => setIsVideoOpen(false)}
              type="button"
              aria-label="Close video"
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                zIndex: 10,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e63a27';
                e.currentTarget.style.borderColor = '#e63a27';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.65)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
            >
              ✕
            </button>

            {/* Responsive 16:9 Video Frame */}
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
              <video
                src="/gemini_generated_video_a09cdd69.mp4"
                controls
                autoPlay
                playsInline
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <style jsx global>{`
            @keyframes fadeInVideo {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
};

export default VedioAreaHomeOne;