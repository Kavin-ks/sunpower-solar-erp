import service_data from '@/data/ServiceData';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { getPackageIcon } from '../common/IndustrialIcons';

const data = service_data.filter((item) => item.path === 'home_1');

const ServiceArea = () => {
  return (
    <>
      <div className="service-section style-three py-5">
        <div className="container">
          <div className="row g-4">
            {data.map((item, i) => (
              <div key={i} className="col-lg-4 col-md-6">
                <div className="card h-100 border rounded-4 overflow-hidden shadow-sm bg-white p-3">
                  <div className="position-relative mb-3" style={{ height: '200px' }}>
                    <Image src={item.img} fill style={{ objectFit: 'cover' }} alt={item.title} className="rounded-3" />
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="p-2 rounded-2 bg-light border">
                      {getPackageIcon(item.iconType, 24)}
                    </div>
                    <h5 className="fw-bold mb-0">
                      <Link href="/service-details" className="text-dark text-decoration-none">
                        {item.title}
                      </Link>
                    </h5>
                  </div>
                  <p className="text-muted small mb-3">{item.sm_des}</p>
                  <Link href="/service-details" className="btn btn-sm btn-dark mt-auto">
                    Read More <i className="bi bi-arrow-up-right ms-1"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceArea;