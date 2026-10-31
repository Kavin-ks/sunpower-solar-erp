import React from 'react';
import ContactFormHomeOne from '@/components/forms/ContactFormHomeOne';
import contact_img_1 from "@/assets/images/resource/choose-thumb.png";
import Image from 'next/image';
import Link from 'next/link';

const contact_area_content = {
  subtitle: 'Why Choose Us',
  title: 'Best Solution For Your Solar Rooftop',
  sm_des: 'Comprehensive rooftop solar installations for residential and commercial properties. Tier-1 high efficiency solar panels with 20-year warranty, grid-tie inverters, and seamless government subsidy processing.',
  festures: [
    'Tier-1 Mono PERC Solar Panels (20-Yr Warranty)',
    'Certified Installation by 15-Crew Technicians',
    'Full TANGEDCO & PM Surya Ghar Subsidy Support',
  ],
  btn_text: 'Get A Quote',
  phone: <>Customer Support <span>+91 7010818264</span></>,
};

const { subtitle, title, sm_des, festures, btn_text, phone } = contact_area_content;

const ContactAreaHomeOne = () => {
  return (
    <>
      <div className="choose-us-section" style={{ paddingTop: '70px', paddingBottom: '70px', background: '#ffffff' }}>
        <div className="container">
          <div className="row choose align-items-center">
            <div className="col-lg-6 col-md-12">
              <div className="section-title wow animate__slideInUp">
                <div className="section-sub-title choose">
                  <h4>{subtitle}</h4>
                </div>
                <div className="section-main-title choose">
                  <h2>{title}</h2>
                </div>
              </div>
              <div className="choose-us-discription wow animate__slideInUp">
                <p>{sm_des}</p>
              </div>
              <div className="choose-us-content wow animate__zoomIn">
                <div className="choose-us-thumb">
                  <Image src={contact_img_1} alt="Solar Rooftop Expert" />
                </div>
                <div className="choose-us-list">
                  <ul>
                    {festures.map((item, index) => (
                      <li key={index}><i className="bi bi-check-circle-fill text-success me-2"></i> {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="choose-us-info mt-4">
                  <div className="solar-btn choose">
                    <Link href="/contact">{btn_text} <i className="bi bi-arrow-right"></i></Link>
                  </div>
                  <div className="choose-us-icon">
                    <i className="bi bi-telephone-plus"></i>
                  </div>
                  <div className="choose-us-phone">
                    <h5>{phone}</h5>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-12">
              <div className="choose-contact-box wow animate__slideInRight shadow-lg rounded-4 p-4 p-md-5" style={{ background: '#e63a27' }}>
                <div className="choose-contact-title mb-4">
                  <h3 className="text-white fw-bold m-0">Make an Appointment</h3>
                  <p className="text-white-50 small mt-1">Book your free rooftop site suitability survey today</p>
                </div>

                <ContactFormHomeOne />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactAreaHomeOne;