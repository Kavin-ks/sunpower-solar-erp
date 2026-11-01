import Link from 'next/link';
import React from 'react';

const hero_content = {
  subtitle: "Odoo Solar Power Company",
  title: "Clean Rooftop Solar Energy for Homes & Businesses",
  sm_des: "Turnkey 1kW to 5kW On-Grid and Off-Grid solar packages with 20-year panel warranty, professional installation, and PM Surya Ghar subsidy approval."
};

const HeroAreaHomeTwo = () => {
  return (
    <>
      <div className="slider-section style-two" style={{ padding: '160px 0 140px' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8 col-md-12">
              <div className="slider-content style-two wow animate__slideInRight">
                <h4 className="text-warning fw-bold mb-2">{hero_content.subtitle}</h4>
                <h1 className="fw-bold mb-3">{hero_content.title}</h1>
                <p className="text-white-50 mb-4 fs-6" style={{ maxWidth: '620px' }}>{hero_content.sm_des}</p>
                <div className="d-flex flex-wrap gap-3">
                  <div className="solar-btn slider1 m-0">
                    <Link href="/contact">Book Free Site Survey <i className="bi bi-arrow-right"></i></Link>
                  </div>
                  <div className="solar-btn slider2 m-0">
                    <Link href="/service">Explore 1kW–5kW Kits <i className="bi bi-arrow-right"></i></Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroAreaHomeTwo;