
'use client'
import React from 'react';
import { toast } from 'react-toastify';

import * as yup from "yup";
import { useForm } from "react-hook-form"
import { yupResolver } from '@hookform/resolvers/yup';


interface FormData {
  Fullname: string;  
  email: string;  
  message: string; 
}
const schema = yup
  .object({
    Fullname: yup.string().required().label("Full Name"), 
    email: yup.string().required().email().label("Email"), 
    message: yup.string().required().label("Message"),
  })
  .required();


const CommentsForm = () => {

  const { register, handleSubmit, reset, formState: { errors }, } = useForm<FormData>({ resolver: yupResolver(schema), });
  const onSubmit = (data: FormData) => {   
    const notify = () => toast("Message send successful");
    notify();
    reset();
    console.log(data);
  };




  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} id="it-form">
        <div className="row">
          <div className="col-lg-6 col-md-6">
            <div className="form-box inner">
              <input type="text" {...register("Fullname")} placeholder="Name*" />
              <i className="bi bi-person"></i>
              <p className="form_error">{errors.Fullname?.message}</p>
            </div>
          </div>
          <div className="col-lg-6 col-md-6">
            <div className="form-box inner">
              <input type="text" {...register("email")} placeholder="E-mail*" />
              <i className="bi bi-envelope"></i>
              <p className="form_error">{errors.email?.message}</p>
            </div>
          </div>
          <div className="col-lg-12 col-md-12">
            <div className="form-box inner">
              <textarea {...register("message")} id="massage" cols={30} rows={10} placeholder="Your Comments*"></textarea>
              <i className="bi bi-chat-left-text-fill"></i>
              <p className="form_error">{errors.message?.message}</p>
            </div>
          </div>
          <div className="col-lg-12 col-md-12">
            <div className="form-box-button inner">
              <button type="submit">Post Comments</button>
            </div>
          </div>
        </div>
      </form>
      <div id="status"></div>
    </>
  );
};

export default CommentsForm;