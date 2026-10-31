"use client"
import React from 'react';

const SubscribeAreaHomeOne = () => {
  return (
    <>
      <div className="subscribe-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 col-md-6">
              <div className="section-title wow animate__slideInLeft">
                <div className="section-main-title Subscribe">
                  <h2>Subscribe For The </h2>
                  <h2>Exclusive</h2>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-6">
              <form onClick={e => e.preventDefault()} id="contact-form">
                <div className="form-box Subscribe wow animate__slideInRight">
                  <input type="text" name="email" placeholder="Your Email Address..." />
                  <button type="submit" className="icons">
                    <i className="bi bi-send"></i>
                  </button>
                </div>
                <div className="checkbox-box">
                  <input type="checkbox" id="reviewcheck" name="reviewcheck" />  {' '}
                  <label htmlFor="reviewcheck"> I agree to the <a href="#">Privacy Policy</a></label>
                </div>

                 


              </form>
              <div id="status"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubscribeAreaHomeOne;