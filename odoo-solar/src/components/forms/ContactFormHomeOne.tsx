'use client'
import React from 'react';
import { toast } from 'react-toastify';

import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';

interface FormData {
  Fullname: string;  
  email: string;   
  phone: string;
  solarSystem: string; 
  systemType: string;
  message: string; 
}

const schema = yup
  .object({
    Fullname: yup.string().required("Full name is required").label("Full Name"), 
    email: yup.string().required("Email address is required").email("Invalid email").label("Email"), 
    phone: yup.string().required("Phone number is required").label("Phone Number"),
    solarSystem: yup.string().required("Please select available solar system").label("Solar System"),
    systemType: yup.string().required("Please select On-Grid or Off-Grid system").label("System Type"),
    message: yup.string().required("Please tell about available sources and questions").label("Available Sources & Questions"),
  })
  .required();

const ContactFormHomeOne = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: FormData) => {   
    toast.success("Appointment request submitted successfully! Our solar engineer will contact you.");

    // 1. Dispatch enquiry to Next.js API route (which reads .env and forwards to Google Apps Script)
    try {
      fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch((e) => console.error('API submission error:', e));
    } catch (apiErr) {
      console.error('Failed to dispatch enquiry to API', apiErr);
    }

    // 2. Client-side direct call to Apps Script if configured
    const clientScriptUrl = process.env.NEXT_PUBLIC_APPSCRIPT_URL;
    if (clientScriptUrl && clientScriptUrl.startsWith('http')) {
      try {
        fetch(clientScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch((e) => console.error('Direct Apps Script error:', e));
      } catch (scriptErr) {
        console.error('Direct script call failed', scriptErr);
      }
    }

    // 3. Sync enquiry to ERP CRM in localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sunpower_erp_state_next_v1');
        const state = saved ? JSON.parse(saved) : { enquiries: [] };
        const newEnq = {
          id: `ENQ-${Date.now().toString().slice(-6)}`,
          customerName: data.Fullname,
          email: data.email,
          phone: data.phone,
          address: data.message,
          source: 'Web Form',
          kw: parseInt(data.solarSystem) || 3,
          systemType: data.systemType === 'Off-Grid' ? 'Off-Grid' : 'On-Grid',
          subsidy: true,
          subsidyStatus: 'Pending Docs',
          shadowFreeSqft: 150,
          monthlyBill: 2500,
          gridSuitable: true,
          surveyor: 'Unassigned',
          roofDirection: 'South',
          roofTilt: 13,
          cableDistance: 15,
          status: 'New Enquiry',
          createdAt: new Date().toISOString().split('T')[0]
        };
        state.enquiries = [newEnq, ...(state.enquiries || [])];
        localStorage.setItem('sunpower_erp_state_next_v1', JSON.stringify(state));
      } catch (err) {
        console.error('Failed to sync to ERP', err);
      }
    }

    reset();
  };
  
  return (
    <>
      <form id="it-form" onSubmit={handleSubmit(onSubmit)} className="contact-form-1">
        <div className="row g-3">
          {/* Full Name */}
          <div className="col-lg-12">
            <div className="form-box">
              <input type="text" {...register("Fullname")} placeholder="Full Name *" />
              <i className="bi bi-person"></i>
              <p className="form_error">{errors.Fullname?.message}</p>
            </div>
          </div>

          {/* Email */}
          <div className="col-lg-6 col-md-6">
            <div className="form-box">
              <input type="text" {...register("email")} placeholder="Email Address *" />
              <i className="bi bi-envelope"></i>
              <p className="form_error">{errors.email?.message}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="col-lg-6 col-md-6">
            <div className="form-box">
              <input type="text" {...register("phone")} placeholder="Phone Number *" />
              <i className="bi bi-phone-flip"></i>
              <p className="form_error">{errors.phone?.message}</p>
            </div>
          </div>

          {/* Dropdown of available solar system 1kW or 5kW */}
          <div className="col-lg-12">
            <div className="form-box">
              <select {...register("solarSystem")} defaultValue="" style={{ color: '#3e3e3f' }}>
                <option value="" disabled>Select Available Solar System (1kW to 5kW) *</option>
                <option value="1kW">1 kW Solar System</option>
                <option value="2kW">2 kW Solar System</option>
                <option value="3kW">3 kW Solar System</option>
                <option value="4kW">4 kW Solar System</option>
                <option value="5kW">5 kW Solar System</option>
              </select>
              <i className="bi bi-sun"></i>
              <p className="form_error">{errors.solarSystem?.message}</p>
            </div>
          </div>

          {/* On-Grid or Off-Grid systems */}
          <div className="col-lg-12">
            <div className="form-box">
              <select {...register("systemType")} defaultValue="" style={{ color: '#3e3e3f' }}>
                <option value="" disabled>Select Off-Grid or On-Grid Systems *</option>
                <option value="On-Grid">On-Grid Solar System</option>
                <option value="Off-Grid">Off-Grid Solar System</option>
                <option value="Hybrid">Hybrid Solar System</option>
              </select>
              <i className="bi bi-plug"></i>
              <p className="form_error">{errors.systemType?.message}</p>
            </div>
          </div>

          {/* Tell about available sources (eg: 10sqft) and questions here */}
          <div className="col-lg-12 col-md-12">
            <div className="form-box">
              <textarea 
                {...register("message")} 
                id="massage" 
                cols={30} 
                rows={5} 
                placeholder="Tell about available sources (eg: 10sqft) and questions here *"
              ></textarea>
              <i className="bi bi-chat-left-text-fill"></i>
              <p className="form_error">{errors.message?.message}</p>
            </div>
          </div>

          {/* Submit */}
          <div className="col-lg-12 col-md-12">
            <div className="form-box-button">
              <button type="submit">Book Site Appointment <i className="bi bi-arrow-right"></i></button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default ContactFormHomeOne;