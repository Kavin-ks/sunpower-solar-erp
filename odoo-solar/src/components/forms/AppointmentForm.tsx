
'use client';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

interface FormData {
  name: string;
  phone: string;
  email: string;
  massage: string;
}

const schema = yup
  .object({
    name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters').label('Name'),
    phone: yup.string().required('Phone number is required').matches(/^[0-9+\s-]{10,15}$/, 'Enter valid 10-digit mobile').label('Phone'),
    email: yup.string().required('Email is required').email('Enter valid email').label('Email'),
    massage: yup.string().required('Requirement details required').label('Message'),
  })
  .required();

const AppointmentForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Fullname: data.name,
          email: data.email,
          phone: data.phone,
          message: data.massage,
          address: 'Installation Site Address - Inquired via FAQ Appointment',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
          solarSystem: '3kW',
          systemType: 'On-Grid',
          monthlyElectricityBill: 3500,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData?.message || 'Failed to submit appointment enquiry.');
      }
      toast.success(`Appointment request submitted! Ref: ${resData.enquiryNumber}`);
      reset();
    } catch (err: any) {
      toast.error(err?.message || 'Error submitting appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form id="it-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="row">
          <div className="col-lg-12">
            <div className="form-box faq">
              <input type="text" {...register('name')} placeholder="Full Name *" />
              <i className="bi bi-person"></i>
              <p className="form_error">{errors.name?.message}</p>
            </div>
          </div>
          <div className="col-lg-12">
            <div className="form-box faq">
              <input type="text" {...register('phone')} placeholder="Mobile Phone (10 digits) *" />
              <i className="bi bi-phone-flip"></i>
              <p className="form_error">{errors.phone?.message}</p>
            </div>
          </div>
          <div className="col-lg-12">
            <div className="form-box faq">
              <input type="text" {...register('email')} placeholder="Email Address *" />
              <i className="bi bi-envelope"></i>
              <p className="form_error">{errors.email?.message}</p>
            </div>
          </div>
          <div className="col-lg-12 col-md-12">
            <div className="form-box faq">
              <textarea {...register('massage')} id="massage" cols={30} rows={4} placeholder="Your Solar Requirements / Remarks *"></textarea>
              <i className="bi bi-chat-left-text-fill"></i>
              <p className="form_error">{errors.massage?.message}</p>
            </div>
          </div>
          <div className="col-lg-12 col-md-12">
            <div className="form-box-button faq">
              <button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default AppointmentForm;