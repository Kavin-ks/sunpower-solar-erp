

'use client'
import React from 'react';
import { toast } from 'react-toastify';

import * as yup from "yup";
import { useForm } from "react-hook-form"
import { yupResolver } from '@hookform/resolvers/yup';


interface FormData {
  Fullname: string;  
  email: string;  
  website: string;  
  message: string; 
}
const schema = yup
  .object({
    Fullname: yup.string().required().label("Full Name"), 
    email: yup.string().required().email().label("Email"), 
    website: yup.string().required().label("Website"), 
    message: yup.string().required().label("Message"),
  })
  .required();


const CommentFormTeam = () => {

  
  const { register, handleSubmit, reset, formState: { errors }, } = useForm<FormData>({ resolver: yupResolver(schema), });
  const onSubmit = (data: FormData) => {   
    const notify = () => toast("Message send successful");
    notify();
    reset();
    console.log(data);
  };



  return (
    <>
      <form id="it-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="row">
          <div className="col-lg-6 col-md-6">
            <div className="form-box inner team">
              <input type="text" {...register("Fullname")} placeholder="Name*" />
              <i className="bi bi-person"></i>
              <p className="form_error">{errors.Fullname?.message}</p>
            </div>
          </div>
          <div className="col-lg-6 col-md-6">
            <div className="form-box inner team">
              <input type="text" {...register("email")} placeholder="E-mail*" />
              <i className="bi bi-envelope"></i>
              <p className="form_error">{errors.email?.message}</p>
            </div>
          </div>
          <div className="col-lg-12 col-md-12">
            <div className="form-box inner team">
              <input type="text" {...register("website")} placeholder="Website*" />
              <i className="bi bi-browser-chrome"></i>
              <p className="form_error">{errors.website?.message}</p>
            </div>
          </div>
          <div className="col-lg-12 col-md-12">
            <div className="form-box inner team">
              <textarea {...register("message")} id="massage" cols={30} rows={10} placeholder="Your Comments*"></textarea>
              <i className="bi bi-chat-left-text-fill"></i>
              <p className="form_error">{errors.message?.message}</p>
            </div>
          </div>
          <div className="col-lg-12 col-md-12">
            <div className="form-box-button inner team">
              <button type="submit">Send Message</button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default CommentFormTeam;