'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Accordion from '../common/Accordion';

import service_details_thumb_1 from '@/assets/images/resource/service-details.png';
import service_details_thumb_2 from '@/assets/images/resource/service-details2.png';
import service_details_thumb_3 from '@/assets/images/resource/service-details3.png';

const ARCHITECTURE_COMPARISON = [
  {
    feature: 'Core Mechanism',
    onGrid: 'Direct connection to DISCOM utility grid with Net Meter',
    offGrid: 'Independent setup with dedicated solar battery bank',
    hybrid: 'Connected to grid with both Net Meter and battery storage',
  },
  {
    feature: 'Grid Dependence',
    onGrid: '100% synchronized with the grid frequency',
    offGrid: 'Zero grid dependence (completely self-sustaining)',
    hybrid: 'Flexible (can switch between grid, solar, and battery)',
  },
  {
    feature: 'During Power Outages',
    onGrid: 'Shuts down automatically (anti-islanding safety)',
    offGrid: 'Continuous 24/7 backup from battery storage',
    hybrid: 'Instant switchover to battery backup without flicker',
  },
  {
    feature: 'Govt. Central Subsidy',
    onGrid: 'Eligible for up to ₹78,000 (PM Surya Ghar Scheme)',
    offGrid: 'Not typically covered under residential grid schemes',
    hybrid: 'Eligible for grid portion in selected DISCOM areas',
  },
  {
    feature: 'Maintenance & Battery',
    onGrid: 'Lowest maintenance (zero batteries to replace)',
    offGrid: 'Requires battery maintenance / replacement after 5–7 yrs',
    hybrid: 'Battery management with automated cell balancing',
  },
  {
    feature: 'Estimated Payback',
    onGrid: '3 to 4 Years (fastest Return on Investment)',
    offGrid: '5 to 6 Years (driven by energy security)',
    hybrid: '4 to 5 Years (balance of savings and security)',
  },
];

const SOLAR_CATEGORIES = [
  { title: '1kW–5kW Solar Packages', link: '/service' },
  { title: 'On-Grid Net Metering Systems', link: '/service-details' },
  { title: 'Off-Grid Battery Storage Systems', link: '/service-details' },
  { title: 'Hybrid Energy Solutions', link: '/service-details' },
  { title: 'PM Surya Ghar Subsidy Guide', link: '/faq' },
  { title: '15-Crew Certified Technicians', link: '/team' },
];

const ServiceDetailsArea = () => {
  return (
    <>
      <div className="service-details-section py-5" style={{ background: '#f8fafc' }}>
        <div className="container">
          <div className="row g-4">
            {/* Left Main Content */}
            <div className="col-lg-8 col-md-12">
              <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
                
                {/* Hero Feature Image */}
                <div className="service-details-thumb mb-4 rounded-3 overflow-hidden">
                  <Image src={service_details_thumb_1} style={{ width: '100%', height: 'auto', objectFit: 'cover' }} alt="Solar Systems Overview" />
                </div>

                <div className="service-details-title mb-3">
                  <span className="badge bg-danger text-white py-1 px-3 fw-semibold mb-2" style={{ fontSize: '12px' }}>
                    Solar Architecture Guide
                  </span>
                  <h2 className="fw-bold text-dark">
                    Understanding On-Grid, Off-Grid & Hybrid Solar Systems
                  </h2>
                </div>

                <div className="service-details-discription text-secondary mb-4" style={{ lineHeight: '1.8' }}>
                  <p>
                    Choosing the right solar architecture depends on your local grid stability, power consumption patterns, and energy goals. At <strong>Odoo Solar Power Company</strong>, we engineer custom 1kW to 5kW turnkey solutions across both grid-connected and battery-backed configurations to maximize return on investment and energy reliability.
                  </p>
                </div>

                {/* Section 1: On-Grid System */}
                <div className="p-4 rounded-3 bg-light border mb-4">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge bg-success py-1.5 px-3 fs-6">1. On-Grid Solar Systems (Grid-Tie)</span>
                    <span className="text-muted small">Most Popular for Urban Homes</span>
                  </div>
                  <p className="text-secondary small mb-3">
                    On-Grid systems remain connected directly to your local electricity utility (e.g., TANGEDCO/TSSPDCL). Solar power generated during the day powers your appliances directly; any surplus power is fed back into the grid through a <strong>Bi-Directional Net Meter</strong>. At night, you draw power from the grid as normal. At the end of the billing cycle, you pay only for net units consumed.
                  </p>
                  <div className="row g-2">
                    <div className="col-sm-6">
                      <div className="bg-white p-2.5 rounded-2 border small">
                        <i className="bi bi-check-circle-fill text-success me-2"></i><strong>Zero Battery Cost:</strong> Lowest initial capital investment.
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="bg-white p-2.5 rounded-2 border small">
                        <i className="bi bi-check-circle-fill text-success me-2"></i><strong>Max Subsidy:</strong> Up to ₹78,000 under PM Surya Ghar.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Off-Grid System */}
                <div className="p-4 rounded-3 bg-light border mb-4">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge bg-primary py-1.5 px-3 fs-6">2. Off-Grid Solar Systems (Battery Storage)</span>
                    <span className="text-muted small">Total Energy Independence</span>
                  </div>
                  <p className="text-secondary small mb-3">
                    Off-Grid systems operate completely autonomously without requiring an active electrical utility grid connection. High-efficiency solar panels charge a dedicated solar battery bank (using advanced <strong>LiFePO4 Lithium Iron Phosphate</strong> or heavy-duty tubular batteries) via an intelligent MPPT charge controller. Power is always available, even during severe power cuts, monsoons, or in remote rural locations.
                  </p>
                  <div className="row g-2">
                    <div className="col-sm-6">
                      <div className="bg-white p-2.5 rounded-2 border small">
                        <i className="bi bi-check-circle-fill text-primary me-2"></i><strong>24/7 Outage Protection:</strong> Unaffected by grid power cuts.
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="bg-white p-2.5 rounded-2 border small">
                        <i className="bi bi-check-circle-fill text-primary me-2"></i><strong>Remote Ready:</strong> Ideal for farmhouses, clinics & factories.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Dual Image Showcase */}
                <div className="row g-3 mb-4">
                  <div className="col-lg-6 col-md-6">
                    <div className="rounded-3 overflow-hidden border shadow-sm">
                      <Image src={service_details_thumb_2} style={{ width: '100%', height: 'auto', objectFit: 'cover' }} alt="On-Grid Inverter Installation" />
                      <div className="p-2.5 bg-white text-center small fw-semibold text-dark">
                        Precision Solar Inverter Mounting
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-6">
                    <div className="rounded-3 overflow-hidden border shadow-sm">
                      <Image src={service_details_thumb_3} style={{ width: '100%', height: 'auto', objectFit: 'cover' }} alt="Rooftop Panel Structure" />
                      <div className="p-2.5 bg-white text-center small fw-semibold text-dark">
                        Elevated Galvanized Rooftop Structure
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Side-by-Side Comparison Table */}
                <div className="mb-4">
                  <h4 className="fw-bold text-dark mb-3">Architecture Comparison Matrix</h4>
                  <div className="table-responsive rounded-3 border">
                    <table className="table table-bordered align-middle mb-0 small">
                      <thead style={{ background: '#19142d', color: '#ffffff' }}>
                        <tr>
                          <th className="py-2.5 px-3">Evaluation Parameter</th>
                          <th className="py-2.5 text-success">On-Grid Systems</th>
                          <th className="py-2.5 text-primary">Off-Grid Systems</th>
                          <th className="py-2.5 text-warning">Hybrid Systems</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ARCHITECTURE_COMPARISON.map((row, idx) => (
                          <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                            <td className="fw-bold text-dark px-3">{row.feature}</td>
                            <td className="text-secondary">{row.onGrid}</td>
                            <td className="text-secondary">{row.offGrid}</td>
                            <td className="text-secondary">{row.hybrid}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 5: Technical FAQ */}
                <div className="mt-4 pt-3 border-top">
                  <h4 className="fw-bold text-dark mb-3">Frequently Asked Questions</h4>
                  <Accordion />
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="col-lg-4 col-md-12">
              <div className="d-flex flex-column gap-4">
                
                {/* Categories Widget */}
                <div className="bg-white p-4 rounded-4 shadow-sm border">
                  <h5 className="fw-bold text-dark mb-3 pb-2 border-bottom">
                    Solar System Options
                  </h5>
                  <ul className="list-unstyled m-0 p-0 d-flex flex-column gap-2">
                    {SOLAR_CATEGORIES.map((item, idx) => (
                      <li key={idx}>
                        <Link
                          href={item.link}
                          className="d-flex align-items-center justify-content-between p-2.5 rounded-3 text-decoration-none text-dark bg-light hover-bg-danger transition"
                          style={{ fontSize: '13px', fontWeight: 500 }}
                        >
                          <span>{item.title}</span>
                          <i className="bi bi-chevron-right text-muted" style={{ fontSize: '11px' }}></i>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Direct Consultation Widget */}
                <div
                  className="p-4 rounded-4 text-white shadow-sm border"
                  style={{ background: 'linear-gradient(135deg, #19142d 0%, #291f4a 100%)', borderLeft: '5px solid #e63a27' }}
                >
                  <span className="badge bg-danger mb-2">Need Expert Help?</span>
                  <h5 className="fw-bold text-white mb-2">Speak with a Solar Engineer</h5>
                  <p className="text-white-50 small mb-3">
                    Unsure whether On-Grid or Off-Grid is best for your roof? We provide free shadow analysis and subsidy guidance.
                  </p>
                  
                  <div className="d-flex flex-column gap-2.5 mb-4">
                    <a
                      href="tel:7010818264"
                      className="d-flex align-items-center gap-2.5 text-white text-decoration-none p-2.5 rounded-3"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                      <i className="bi bi-telephone-fill text-warning fs-5"></i>
                      <div>
                        <div className="text-white-50" style={{ fontSize: '10px' }}>Call Us Directly</div>
                        <div className="fw-bold" style={{ fontSize: '14px' }}>+91 7010818264</div>
                      </div>
                    </a>

                    <a
                      href="mailto:Odoo@gmail.com"
                      className="d-flex align-items-center gap-2.5 text-white text-decoration-none p-2.5 rounded-3"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                      <i className="bi bi-envelope-fill text-warning fs-5"></i>
                      <div>
                        <div className="text-white-50" style={{ fontSize: '10px' }}>Email Engineering</div>
                        <div className="fw-bold" style={{ fontSize: '14px' }}>Odoo@gmail.com</div>
                      </div>
                    </a>

                    <div
                      className="d-flex align-items-center gap-2.5 text-white-50 p-2.5 rounded-3"
                      style={{ background: 'rgba(255,255,255,0.08)', fontSize: '12px' }}
                    >
                      <i className="bi bi-geo-alt-fill text-warning fs-5"></i>
                      <div>
                        <div className="text-white fw-semibold">Hyderabad Office:</div>
                        <div>Odoo Solar System, Geethanjali college of engineering, hyderabad</div>
                      </div>
                    </div>
                  </div>

                  <Link href="/contact" className="btn btn-danger w-100 py-2.5 fw-bold rounded-3" style={{ background: '#e63a27' }}>
                    Book Free Site Survey <i className="bi bi-arrow-right ms-1"></i>
                  </Link>
                </div>

                {/* 20-Year Warranty Badge */}
                <div className="bg-white p-4 rounded-4 shadow-sm border text-center">
                  <div className="bg-light text-danger rounded-circle mx-auto p-3 d-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
                    <i className="bi bi-shield-check fs-2 text-success"></i>
                  </div>
                  <h6 className="fw-bold text-dark mb-1">20-Year Panel Performance Guarantee</h6>
                  <p className="text-muted small mb-0">
                    Tier-1 Mono PERC panels backed by 20-year linear power warranty and 2-year inverter replacement guarantee.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceDetailsArea;