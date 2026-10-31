
import React from 'react';
import AppointmentForm from '../forms/AppointmentForm';
import Accordion from '../common/Accordion';

const FaqArea = () => {
  return (
    <>

      <div className="faq-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 col-md-12">
              <div className="section-title wow fadeInUp animated animated">
                <div className="section-sub-title faq">
                  <h4>Faq Asked</h4>
                </div>
                <div className="section-main-title faq">
                  <h2>Want to Ask Something from Us?</h2>
                </div>
                <div className="faq-discription">
                  <p>Asi enim ad minim veniam, quis nostrud exerci Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor</p>
                </div>
              </div>
              <div className="tab_container">
                <div id="tab1" className="tab_content">
                  <Accordion /> 
                </div>
              </div>

            </div>
            <div className="col-lg-6 col-md-12">
              <div className="choose-contact-box faq">
                <div className="choose-contact-title faq">
                  <h4>Make an Appointment</h4>
                </div>
                <AppointmentForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FaqArea;