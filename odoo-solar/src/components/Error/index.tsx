
import React from 'react';
import HeaderOne from '@/layouts/headers/HeaderOne';
import Breadcrumb from '../common/breadcrumb/breadcrumb';
import FooterOne from '@/layouts/footers/FooterOne';
import error_img from '@/assets/images/resource/error-thumb.png';
import Image from 'next/image';
import Link from 'next/link';

const Error = () => {
  return (
    <>
      <HeaderOne />
      <main>
        <Breadcrumb top_title='Error Page' title='404' />
        <div className="error-section">
          <div className="container">
            <div className="row">
              <div className="col-lg-12 text-center">
                <div className="error-thumb mb-60">
                  <Image src={error_img} style={{height: 'auto'}} alt="error" />
                </div>
                <div className="solar-btn text-center">
                  <Link href="/">Go To Home <i className="bi bi-arrow-right"></i></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <FooterOne />
    </>
  );
};

export default Error;