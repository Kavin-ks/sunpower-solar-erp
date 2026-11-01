'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

interface FormData {
  Fullname: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  solarSystem: string;
  systemType: string;
  subsidyRequired: boolean;
  message: string;
}

const schema = yup
  .object({
    Fullname: yup.string().required('Full name is required').min(2, 'Name must be at least 2 characters').label('Full Name'),
    email: yup.string().email('Invalid email address').required('Email address is required').label('Email'),
    phone: yup.string().required('Phone number is required').matches(/^[0-9+\s-]{10,15}$/, 'Please enter a valid 10-digit mobile number').label('Phone Number'),
    address: yup.string().required('Installation / rooftop site address is required').label('Site Address'),
    city: yup.string().required('City is required').label('City'),
    state: yup.string().default('Tamil Nadu').label('State'),
    pincode: yup.string().matches(/^[0-9]{6}$/, 'PIN Code must be 6 digits').required('PIN Code is required').label('PIN Code'),
    solarSystem: yup.string().required('Please select solar system capacity').label('Solar System'),
    systemType: yup.string().required('Please select system type').label('System Type'),
    subsidyRequired: yup.boolean().default(true),
    message: yup.string().default('').label('Requirements & Remarks'),
  })
  .required();

const ContactFormHomeOne = () => {
  const [submitting, setSubmitting] = useState(false);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<{ enquiryNumber: string; message: string } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      state: 'Tamil Nadu',
      city: 'Chennai',
      pincode: '600001',
      subsidyRequired: true,
      systemType: 'On-Grid',
      solarSystem: '3kW',
    },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        throw new Error(resData?.message || 'Failed to submit enquiry. Please verify details.');
      }

      setSubmittedEnquiry({
        enquiryNumber: resData.enquiryNumber,
        message: resData.message || 'Enquiry registered successfully!',
      });
      toast.success(`Enquiry submitted! Reference: ${resData.enquiryNumber}`);
      reset();
    } catch (err: any) {
      console.error('[Customer Portal] Submission error:', err);
      const errMsg = err?.message || 'Failed to connect to central server. Please try again.';
      setServerError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {submittedEnquiry && (
        <div
          className="alert alert-success p-3 rounded-3 mb-4 shadow-sm"
          style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#065f46' }}
        >
          <div className="d-flex align-items-center mb-1">
            <i className="bi bi-check-circle-fill me-2 fs-5 text-success"></i>
            <h5 className="mb-0 fw-bold text-success">Enquiry Submitted Successfully!</h5>
          </div>
          <p className="mb-1" style={{ fontSize: '13px' }}>
            Enquiry Reference ID: <strong>{submittedEnquiry.enquiryNumber}</strong>
          </p>
          <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
            Thank you! Your rooftop solar requirement has been registered in the central SunPower database. Our Sales
            team will review your requirement and call you shortly to schedule your site evaluation.
          </p>
        </div>
      )}

      {serverError && (
        <div className="alert alert-danger p-3 rounded-3 mb-4 shadow-sm" style={{ fontSize: '13px' }}>
          <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
          {serverError}
        </div>
      )}

      <form id="it-form" onSubmit={handleSubmit(onSubmit)} className="contact-form-1">
        <div className="row g-3">
          {/* Full Name */}
          <div className="col-12">
            <div className="form-box">
              <input type="text" {...register('Fullname')} placeholder="Full Name *" />
              <i className="bi bi-person"></i>
              <p className="form_error">{errors.Fullname?.message}</p>
            </div>
          </div>

          {/* Email */}
          <div className="col-12 col-md-6">
            <div className="form-box">
              <input type="text" {...register('email')} placeholder="Email Address *" />
              <i className="bi bi-envelope"></i>
              <p className="form_error">{errors.email?.message}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="col-12 col-md-6">
            <div className="form-box">
              <input type="text" {...register('phone')} placeholder="Mobile Phone (10 digits) *" />
              <i className="bi bi-phone-flip"></i>
              <p className="form_error">{errors.phone?.message}</p>
            </div>
          </div>

          {/* Site Address */}
          <div className="col-12">
            <div className="form-box">
              <input type="text" {...register('address')} placeholder="Rooftop Installation Site Address *" />
              <i className="bi bi-geo-alt"></i>
              <p className="form_error">{errors.address?.message}</p>
            </div>
          </div>

          {/* City */}
          <div className="col-12 col-sm-4">
            <div className="form-box">
              <input type="text" {...register('city')} placeholder="City *" />
              <i className="bi bi-building"></i>
              <p className="form_error">{errors.city?.message}</p>
            </div>
          </div>

          {/* State */}
          <div className="col-12 col-sm-4">
            <div className="form-box">
              <input type="text" {...register('state')} placeholder="State *" />
              <i className="bi bi-map"></i>
              <p className="form_error">{errors.state?.message}</p>
            </div>
          </div>

          {/* PIN Code */}
          <div className="col-12 col-sm-4">
            <div className="form-box">
              <input type="text" {...register('pincode')} placeholder="PIN Code (6 digits) *" />
              <i className="bi bi-pin-map"></i>
              <p className="form_error">{errors.pincode?.message}</p>
            </div>
          </div>

          {/* Solar Capacity 1kW to 5kW */}
          <div className="col-12 col-md-6">
            <div className="form-box">
              <select {...register('solarSystem')} style={{ color: '#3e3e3f' }}>
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

          {/* System Type */}
          <div className="col-12 col-md-6">
            <div className="form-box">
              <select {...register('systemType')} style={{ color: '#3e3e3f' }}>
                <option value="On-Grid">On-Grid Solar System</option>
                <option value="Off-Grid">Off-Grid Solar System</option>
              </select>
              <i className="bi bi-plug"></i>
              <p className="form_error">{errors.systemType?.message}</p>
            </div>
          </div>

          {/* Subsidy Option */}
          <div className="col-12">
            <div className="form-check d-flex align-items-center gap-2 p-2 bg-light rounded-2 border">
              <input
                type="checkbox"
                className="form-check-input mt-0"
                id="subsidyCheckHome"
                {...register('subsidyRequired')}
                defaultChecked={true}
              />
              <label className="form-check-label text-dark fw-semibold" htmlFor="subsidyCheckHome" style={{ fontSize: '13px' }}>
                Apply for Central Government Subsidy (PM Surya Ghar Muft Bijli Yojana)
              </label>
            </div>
          </div>

          {/* Remarks */}
          <div className="col-lg-12 col-md-12">
            <div className="form-box">
              <textarea
                {...register('message')}
                id="massage"
                cols={30}
                rows={3}
                placeholder="Rooftop shadow-free area (approx. sq.ft), current monthly EB bill (₹), or special requirements"
              ></textarea>
              <i className="bi bi-chat-left-text-fill"></i>
              <p className="form_error">{errors.message?.message}</p>
            </div>
          </div>

          {/* Submit */}
          <div className="col-lg-12 col-md-12">
            <div className="form-box-button">
              <button type="submit" disabled={submitting} style={{ opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Submitting Enquiry...' : 'Book Rooftop Solar Consultation'}{' '}
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default ContactFormHomeOne;