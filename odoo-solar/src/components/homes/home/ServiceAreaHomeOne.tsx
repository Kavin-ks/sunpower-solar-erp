'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import service_data, { ServiceItem } from '@/data/ServiceData';
import {
  getPackageIcon,
  PvModulesGridIcon,
  RoofFootprintIcon,
  EnergyYieldIcon,
  SubsidySealIcon,
} from '@/components/common/IndustrialIcons';

const services = service_data.filter((item) => item.path === 'home_1');

const ServiceAreaHomeOne = ({ style, style_2 }: { style?: boolean; style_2?: boolean }) => {
  const data: ServiceItem[] = style ? service_data : services;

  return (
    <>
      <style>{`
        .industrial-solar-card {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid #e2e8f0;
        }
        .industrial-solar-card:hover {
          transform: translateY(-7px);
          box-shadow: 0 20px 35px -10px rgba(15, 23, 42, 0.14) !important;
        }
        .industrial-solar-thumb img {
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .industrial-solar-card:hover .industrial-solar-thumb img {
          transform: scale(1.05);
        }
        .industrial-btn-cta {
          background: #19142d;
          color: #ffffff;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .industrial-btn-cta:hover {
          background: #e63a27 !important;
          color: #ffffff !important;
          transform: translateY(-1px);
        }
      `}</style>

      <section className="py-5" style={{ background: '#f8fafc' }}>
        <div className="container py-4">
          {!style_2 && (
            <div className="row mb-5">
              <div className="col-lg-12">
                <div className="text-center">
                  <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill mb-2" style={{ background: '#ffedd5', border: '1px solid #fed7aa' }}>
                    <span className="badge rounded-circle p-1" style={{ background: '#e63a27' }}></span>
                    <span className="fw-bold text-uppercase" style={{ fontSize: '12px', color: '#c2410c', letterSpacing: '1px' }}>
                      Industrial-Grade Rooftop Systems
                    </span>
                  </div>
                  <h2 className="fw-bold text-dark fs-1 mt-1 mb-3">
                    Certified 1kW to 5kW Solar Packages
                  </h2>
                  <p className="text-muted mx-auto fs-6" style={{ maxWidth: '720px', lineHeight: '1.6' }}>
                    Turnkey standardized On-Grid & Off-Grid rooftop installations featuring Tier-1 550W Half-Cut Mono PERC modules, automated Bill of Materials, 20-year linear performance warranty, and direct PM Surya Ghar central subsidy approval.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="row g-4">
            {data.map((item, index) => (
              <div key={index} className="col-lg-4 col-md-6">
                <div className="card industrial-solar-card h-100 rounded-4 overflow-hidden bg-white shadow-sm">
                  {/* Card Thumbnail Header */}
                  <div className="industrial-solar-thumb position-relative overflow-hidden" style={{ height: '220px', background: '#0f172a' }}>
                    <Image
                      src={item.img}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: 'cover', opacity: 0.92 }}
                    />
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100"
                      style={{
                        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.5) 0%, rgba(15, 23, 42, 0) 45%, rgba(15, 23, 42, 0.75) 100%)',
                      }}
                    />

                    {/* Floating Capacity Badge */}
                    <div className="position-absolute top-0 start-0 m-3 z-2">
                      <span
                        className="badge text-white fw-bold px-3 py-2 shadow-sm d-inline-flex align-items-center gap-1.5"
                        style={{
                          background: 'rgba(15, 23, 42, 0.88)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          borderRadius: '24px',
                          fontSize: '13px',
                          letterSpacing: '0.5px',
                        }}
                      >
                        <span className="rounded-circle" style={{ width: '8px', height: '8px', background: '#10b981' }}></span>
                        {item.capacity} Plant
                      </span>
                    </div>

                    {/* Floating Tier / Subsidy Tag */}
                    <div className="position-absolute top-0 end-0 m-3 z-2">
                      <span
                        className="badge text-white fw-semibold px-2.5 py-1.5 shadow-sm"
                        style={{
                          background: '#e63a27',
                          borderRadius: '20px',
                          fontSize: '11px',
                          letterSpacing: '0.4px',
                        }}
                      >
                        {item.badgeTag}
                      </span>
                    </div>

                    {/* Appliance Summary Pill on Image Base */}
                    <div className="position-absolute bottom-0 start-0 m-3 z-2">
                      <span
                        className="badge text-white fw-normal px-2.5 py-1"
                        style={{
                          background: 'rgba(0, 0, 0, 0.65)',
                          backdropFilter: 'blur(4px)',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                        }}
                      >
                        ⚡ Powers: {item.appliances}
                      </span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-4 d-flex flex-column flex-grow-1">
                    {/* Industrial Icon & Title Header */}
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div
                        className="p-2.5 rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                        style={{
                          width: '54px',
                          height: '54px',
                          background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {getPackageIcon(item.iconType, 32)}
                      </div>
                      <div>
                        <span className="text-uppercase text-muted fw-bold" style={{ fontSize: '10.5px', letterSpacing: '0.7px' }}>
                          PM Surya Ghar Approved
                        </span>
                        <h4 className="fw-bold fs-5 text-dark mb-0 lh-sm">
                          <Link href="/service-details" className="text-dark text-decoration-none">
                            {item.title}
                          </Link>
                        </h4>
                      </div>
                    </div>

                    {/* Industrial Spec Badges (Panels, Footprint, Generation) */}
                    <div className="d-flex flex-wrap gap-1.5 mb-3">
                      <span
                        className="badge d-inline-flex align-items-center gap-1.5 text-dark fw-medium"
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '11.5px', padding: '5px 8px', borderRadius: '6px' }}
                      >
                        <span style={{ color: '#e63a27' }}>
                          <PvModulesGridIcon size={13} />
                        </span>
                        {item.panels}
                      </span>
                      <span
                        className="badge d-inline-flex align-items-center gap-1.5 text-dark fw-medium"
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '11.5px', padding: '5px 8px', borderRadius: '6px' }}
                      >
                        <span style={{ color: '#0284c7' }}>
                          <RoofFootprintIcon size={13} />
                        </span>
                        {item.area}
                      </span>
                      <span
                        className="badge d-inline-flex align-items-center gap-1.5 text-dark fw-medium"
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '11.5px', padding: '5px 8px', borderRadius: '6px' }}
                      >
                        <span style={{ color: '#f59e0b' }}>
                          <EnergyYieldIcon size={13} />
                        </span>
                        {item.generation}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-muted small mb-3 flex-grow-1" style={{ lineHeight: '1.5', minHeight: '44px' }}>
                      {item.sm_des}
                    </p>

                    {/* Financial & Subsidy Calculation Matrix Box */}
                    <div
                      className="rounded-3 p-3 mb-3"
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1.5">
                        <span className="small text-muted" style={{ fontSize: '12px' }}>Total Package Cost:</span>
                        <span className="fw-semibold text-muted text-decoration-line-through" style={{ fontSize: '13px' }}>{item.price}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center text-success mb-2" style={{ fontSize: '12px' }}>
                        <span className="d-inline-flex align-items-center gap-1 fw-medium">
                          <SubsidySealIcon size={15} /> Govt. Central Subsidy:
                        </span>
                        <span className="fw-bold">− {item.subsidy}</span>
                      </div>
                      <div
                        className="d-flex justify-content-between align-items-center pt-2"
                        style={{ borderTop: '1px dashed #cbd5e1' }}
                      >
                        <span className="small fw-bold text-dark" style={{ fontSize: '12.5px' }}>Net Effective Cost:</span>
                        <span className="fw-bold fs-6" style={{ color: '#e63a27' }}>{item.netCost}</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Link
                      href="/service-details"
                      className="btn industrial-btn-cta w-100 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm text-decoration-none"
                      style={{
                        borderRadius: '10px',
                        padding: '10px 16px',
                        fontSize: '13px',
                      }}
                    >
                      <span>View Architecture & Subsidy Matrix</span>
                      <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default ServiceAreaHomeOne;