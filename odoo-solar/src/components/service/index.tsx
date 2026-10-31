'use client';

import React from 'react';
import Link from 'next/link';
import HeaderOne from '@/layouts/headers/HeaderOne';
import Breadcrumb from '../common/breadcrumb/breadcrumb';
import ServiceAreaHomeOne from '../homes/home/ServiceAreaHomeOne';
import VedioAreaHomeOne from '../homes/home/VedioAreaHomeOne';
import ContactAreaHomeOne from '../homes/home/ContactAreaHomeOne';
import SubscribeAreaHomeOne from '../homes/home/SubscribeAreaHomeOne';
import FooterOne from '@/layouts/footers/FooterOne';

const PACKAGE_COMPARISON = [
  {
    kw: '1 kW',
    target: '1–2 BHK Homes (Basic Load)',
    panels: '2x 550W Mono PERC',
    inverter: '1kW String / Micro Inverter',
    roofArea: '80–100 sq.ft.',
    unitsMonthly: '~120 Units (kWh)',
    basePrice: '₹68,000',
    subsidy: '₹30,000',
    netCost: '₹38,000',
    warranty: '20 Yrs Panels / 2 Yrs Inverter',
  },
  {
    kw: '2 kW',
    target: '2–3 BHK Houses (Moderate Load)',
    panels: '4x 550W Mono PERC',
    inverter: '2kW High Efficiency Inverter',
    roofArea: '180–200 sq.ft.',
    unitsMonthly: '~250 Units (kWh)',
    basePrice: '₹1,28,000',
    subsidy: '₹60,000',
    netCost: '₹68,000',
    warranty: '20 Yrs Panels / 2 Yrs Inverter',
  },
  {
    kw: '3 kW',
    target: '3–4 BHK (1 Inverter AC + Home)',
    panels: '6x 550W Mono PERC',
    inverter: '3kW Smart WiFi Grid-Tie Inverter',
    roofArea: '260–300 sq.ft.',
    unitsMonthly: '~380 Units (kWh)',
    basePrice: '₹1,85,000',
    subsidy: '₹78,000 (Max Tier)',
    netCost: '₹1,07,000',
    warranty: '20 Yrs Panels / 2 Yrs Inverter',
  },
  {
    kw: '4 kW',
    target: 'Multi-Floor Duplex (2 ACs + Motor)',
    panels: '8x 550W Mono PERC',
    inverter: '4kW Dual-MPPT Inverter',
    roofArea: '360–400 sq.ft.',
    unitsMonthly: '~500 Units (kWh)',
    basePrice: '₹2,35,000',
    subsidy: '₹78,000',
    netCost: '₹1,57,000',
    warranty: '20 Yrs Panels / 2 Yrs Inverter',
  },
  {
    kw: '5 kW',
    target: 'Villas, Factories & Clinics (3 ACs)',
    panels: '10x 550W Mono PERC',
    inverter: '5kW 3-Phase / 1-Phase Dual-MPPT',
    roofArea: '450–500 sq.ft.',
    unitsMonthly: '~620 Units (kWh)',
    basePrice: '₹2,85,000',
    subsidy: '₹78,000',
    netCost: '₹2,07,000',
    warranty: '20 Yrs Panels / 2 Yrs Inverter',
  },
];

const STANDARD_BOM_INCLUSIONS = [
  { icon: 'bi-grid-3x3', title: 'Tier-1 Mono PERC Panels', desc: 'Half-cut 550W high-efficiency cells with 20-year linear performance warranty.' },
  { icon: 'bi-cpu', title: 'Digital Smart Inverters', desc: 'Pure sine wave String/Hybrid inverters with WiFi app cloud generation tracking.' },
  { icon: 'bi-shield-check', title: 'ACDB & DCDB Surge Boxes', desc: 'Dual-protection junction boxes with SPD lightning surge and MCB isolation.' },
  { icon: 'bi-layers', title: 'Hot-Dip Galvanized Stands', desc: 'Corrosion-proof elevated module mounting structures rated for 150 km/h winds.' },
  { icon: 'bi-lightning', title: 'Chemical Earthing Electrodes', desc: 'Complete safety earthing kits with copper bonding cables and lightning arrestor.' },
  { icon: 'bi-file-earmark-check', title: 'DISCOM Net-Meter Liaison', desc: 'End-to-end paperwork for bi-directional net meter installation and subsidy disbursement.' },
];

const Service = () => {
  return (
    <>
      <HeaderOne />
      <main>
        {/* Breadcrumb Header */}
        <Breadcrumb top_title="Standardized Packages" title="1kW–5kW Solar Packages" />

        {/* 1kW-5kW Cards Grid */}
        <ServiceAreaHomeOne style={true} />

        {/* Technical & Subsidy Comparison Table */}
        <section className="py-5" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div className="container">
            <div className="text-center mb-5">
              <span className="badge bg-warning text-dark py-1.5 px-3 fw-bold mb-2">Detailed Specifications</span>
              <h2 className="fw-bold">1kW to 5kW Package Comparison & Subsidy Matrix</h2>
              <p className="text-muted mx-auto" style={{ maxWidth: '650px' }}>
                Clear breakdown of system capacity, roof space requirements, monthly power generation, and central PM Surya Ghar Muft Bijli Yojana subsidies.
              </p>
            </div>

            <div className="table-responsive bg-white rounded-4 shadow-sm border p-3">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: '#19142d', color: '#ffffff' }}>
                  <tr>
                    <th className="py-3 px-3">System</th>
                    <th className="py-3">Target Application</th>
                    <th className="py-3">Modules (550W)</th>
                    <th className="py-3">Roof Area Req.</th>
                    <th className="py-3">Est. Monthly Power</th>
                    <th className="py-3">Base Price</th>
                    <th className="py-3 text-success">Govt. Subsidy</th>
                    <th className="py-3 text-danger fw-bold">Est. Net Cost</th>
                    <th className="py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {PACKAGE_COMPARISON.map((pkg, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                      <td className="px-3">
                        <span className="badge bg-primary fs-6 px-2.5 py-1.5">{pkg.kw}</span>
                      </td>
                      <td className="small fw-semibold text-dark">{pkg.target}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{pkg.panels}</span>
                      </td>
                      <td className="small text-muted">{pkg.roofArea}</td>
                      <td className="fw-bold text-success">{pkg.unitsMonthly}</td>
                      <td className="small text-muted text-decoration-line-through">{pkg.basePrice}</td>
                      <td className="fw-bold text-success">-{pkg.subsidy}</td>
                      <td className="fw-bold text-danger fs-6">{pkg.netCost}</td>
                      <td className="text-center">
                        <Link href="/contact" className="btn btn-sm btn-outline-danger px-3 py-1 fw-semibold" style={{ fontSize: '12px' }}>
                          Book Survey
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subsidies notice */}
            <div className="mt-4 p-3 rounded-3 bg-white border d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                  <i className="bi bi-award fs-5"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-dark">PM Surya Ghar: Muft Bijli Yojana Approved Vendor</h6>
                  <p className="text-muted small mb-0">Our team handles 100% of the portal documentation, DISCOM site inspection, and subsidy bank credit.</p>
                </div>
              </div>
              <Link href="/contact" className="btn btn-danger btn-sm px-4 py-2 fw-semibold" style={{ background: '#e63a27' }}>
                Check Subsidy Eligibility <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>
        </section>

        {/* Standard Auto-BOM Inclusions */}
        <section className="py-5 bg-white">
          <div className="container">
            <div className="text-center mb-5">
              <span className="badge bg-danger text-white py-1.5 px-3 fw-bold mb-2">Automated Bill of Materials</span>
              <h2 className="fw-bold">Standard Hardware Included With Every Package</h2>
              <p className="text-muted mx-auto" style={{ maxWidth: '650px' }}>
                Zero hidden costs. Every 1kW to 5kW turnkey package includes complete Tier-1 serialized hardware and certified installation.
              </p>
            </div>

            <div className="row g-4">
              {STANDARD_BOM_INCLUSIONS.map((bom, i) => (
                <div key={i} className="col-lg-4 col-md-6">
                  <div className="p-4 rounded-4 border bg-light h-100 shadow-sm d-flex gap-3 align-items-start">
                    <div className="bg-white rounded-3 p-3 shadow-sm border text-danger d-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                      <i className={`bi ${bom.icon} fs-4`}></i>
                    </div>
                    <div>
                      <h5 className="fw-bold fs-6 mb-1 text-dark">{bom.title}</h5>
                      <p className="text-muted small mb-0">{bom.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Installation Video Showcase */}
        <VedioAreaHomeOne />

        {/* Appointment Form */}
        <ContactAreaHomeOne />

        {/* Newsletter */}
        <SubscribeAreaHomeOne />
      </main>
      <FooterOne />
    </>
  );
};

export default Service;