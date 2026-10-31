

import React from 'react';

const cta_content = {
  phone: "+51 (0) 888 455 369",
  sm_des: "Perfectly simple & easy to distinguish free hour when power of choice isnothing prevents our being. Mistaken idea denouncing",
}

const CtaAreaHomeTwo = () => {
  return (
    <>
      <div className="call-back-section wow animate__slideInUp">
        <div className="container">
          <div className="row">
            <div className="col-lg-3"></div>
            <div className="col-lg-6 col-md-12">
              <div className="call-back-content text-center">
                <div className="call-back-numbar">
                  <h3>{cta_content.phone}</h3>
                </div>
                <div className="call-back-discription">
                  <p>{cta_content.sm_des}</p>
                </div>
                <div className="solar-btn call-back">
                  <a href="#">Get Call Back <i className="bi bi-arrow-right"></i></a>
                </div>
              </div>
            </div>
            <div className="col-lg-3"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CtaAreaHomeTwo;