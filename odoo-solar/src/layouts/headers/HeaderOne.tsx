'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import NavMenu from './Menu/NavMenu';
import UseSticky from '@/hooks/UseSticky';
import MobileMeneu from './Menu/MobileMeneu';
import SearchPopup from '@/components/common/SearchPopup';

const HeaderOne = ({ style }: any) => {
  const { sticky } = UseSticky();
  const [searchPopup, setSearchPopup] = useState<boolean>(false);

  return (
    <>
      {/* Main Header: Minimal sleek height, brand "Odoo Solar Power Company", all menu items on ONE STRAIGHT LINE */}
      <header
        className={`solar-header-section ${style ? 'style-two' : ''} ${sticky ? 'sticky-nav' : ''}`}
        id="sticky-header"
        style={{
          background: '#ffffff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          position: 'relative',
          zIndex: 999
        }}
      >
        <div className="container-fluid px-lg-5">
          <div className="d-flex align-items-center justify-content-between py-2" style={{ minHeight: '68px' }}>
            
            {/* BRAND: Odoo Solar Power Logo Image */}
            <div className="d-flex align-items-center flex-shrink-0 py-1" style={{ maxWidth: '340px' }}>
              <Link href="/" className="d-flex align-items-center text-decoration-none">
                <img
                  src="/odoo_logo.png"
                  alt="Odoo Solar System ERP"
                  style={{
                    height: '56px',
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </Link>
            </div>

            {/* NAV MENU: Single straight line with compact spacing */}
            <div className="header-menu-container flex-grow-1 d-none d-lg-flex justify-content-center mx-2">
              <nav className="minimal-solar-nav">
                <NavMenu />
              </nav>
            </div>

            {/* RIGHT BUTTONS: Search & ERP Launcher */}
            <div className="d-flex align-items-center gap-3 flex-shrink-0">
              <button
                type="button"
                className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center p-2 text-dark shadow-none border"
                style={{ width: '38px', height: '38px' }}
                onClick={() => setSearchPopup(true)}
                title="Search"
              >
                <i className="bi bi-search" style={{ fontSize: '15px' }}></i>
              </button>

              <Link
                href="/contact"
                className="btn btn-sm text-white fw-bold d-flex align-items-center gap-2 px-3 py-2 shadow-sm"
                style={{
                  background: '#e63a27',
                  borderRadius: '6px',
                  fontSize: '14px',
                  letterSpacing: '0.2px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>Get A Quote</span>
                <i className="bi bi-arrow-right"></i>
              </Link>
            </div>

          </div>
        </div>

        {/* Global minimal header overrides to prevent menu wrapping and reduce excessive height */}
        <style jsx global>{`
          .solar-header-section::before {
            display: none !important;
          }
          .minimal-solar-nav ul {
            display: flex !important;
            flex-wrap: nowrap !important;
            align-items: center !important;
            margin: 0 !important;
            padding: 0 !important;
            list-style: none !important;
            white-space: nowrap !important;
          }
          .minimal-solar-nav ul li {
            position: relative;
            margin: 0 10px !important;
            display: inline-block;
          }
          @media (min-width: 1400px) {
            .minimal-solar-nav ul li {
              margin: 0 14px !important;
            }
          }
          .minimal-solar-nav ul li a {
            display: inline-block !important;
            padding: 14px 4px !important;
            font-size: 15px !important;
            font-weight: 600 !important;
            color: #1e293b !important;
            text-decoration: none !important;
            transition: color 0.2s ease !important;
            white-space: nowrap !important;
          }
          .minimal-solar-nav ul li a:hover {
            color: #e63a27 !important;
          }
          .minimal-solar-nav ul li:hover .sub-menu {
            visibility: visible !important;
            opacity: 1 !important;
            top: 100% !important;
          }
          .minimal-solar-nav .sub-menu {
            position: absolute !important;
            top: 120% !important;
            left: 0 !important;
            background: #ffffff !important;
            min-width: 240px !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.12) !important;
            border-radius: 8px !important;
            border-top: 3px solid #e63a27 !important;
            visibility: hidden !important;
            opacity: 0 !important;
            transition: all 0.25s ease !important;
            z-index: 1000 !important;
            padding: 8px 0 !important;
          }
          .minimal-solar-nav .sub-menu ul {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .minimal-solar-nav .sub-menu ul li {
            margin: 0 !important;
            width: 100% !important;
          }
          .minimal-solar-nav .sub-menu ul li a {
            padding: 8px 18px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            color: #334155 !important;
            display: block !important;
          }
          .minimal-solar-nav .sub-menu ul li a:hover {
            background: #fff5f3 !important;
            color: #e63a27 !important;
          }
        `}</style>
      </header>

      <MobileMeneu />
      <SearchPopup searchPopup={searchPopup} setSearchPopup={setSearchPopup} />
    </>
  );
};

export default HeaderOne;