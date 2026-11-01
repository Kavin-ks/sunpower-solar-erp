

import React from 'react';
import ContactForm from '../forms/ContactForm';


interface DataType {
  subtitle: string;
  title: string;
  sm_info: string;
  contact_data: {
    id: number;
    icon: string;
    title: string;
    info: string;
  }[];
}

const contact_content: DataType = {
  subtitle: "Contact Wlth Us",
  title: "Get In Touch!",
  sm_info: "Get in Touch! Contact with us Get in Touch! Contact with us",
  contact_data: [
    {
      id: 1,
      icon: "bi bi-geo-alt-fill",
      title: "Address",
      info: "Odoo Solar System, Geethanjali college of engineering, hyderabad",
    },
    {
      id: 2,
      icon: "bi bi-phone-flip",
      title: "Call Us Today",
      info: "+91 7010818264",
    },
    {
      id: 3,
      icon: "bi bi-envelope",
      title: "Email Us",
      info: "Odoo@gmail.com",
    }

  ]
}

const { subtitle, title, sm_info, contact_data } = contact_content

const ContactArea = () => {
  return (
    <>
      <div className="contact-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 col-md-12">
              <div className="contact-title">
                <div className="contact-sub-title ">
                  <h4>{subtitle}</h4>
                </div>
                <div className="contact-main-title">
                  <h2>{title}</h2>
                </div>
                <div className="contact-discription">
                  <p>{sm_info}</p>
                </div>
              </div>

              {contact_data.map((item, i) => (
                <div key={i} className="contact-box-item">
                  <div className="contact-icon">
                    <i className={item.icon}></i>
                  </div>
                  <div className="contact-adress">
                    <h5>{item.title}</h5>
                    <span>{item.info}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="col-lg-6 col-md-12">
              <div className="choose-contact-box contact-inner">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactArea;