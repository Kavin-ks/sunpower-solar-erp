'use client';

import React from 'react';
import testiomonial_data from '@/data/TestiomonialData';
import { Swiper, SwiperSlide } from 'swiper/react'; 
import { Navigation, Pagination } from 'swiper/modules'; 
import testi_icon from "@/assets/images/resource/testi-icon.png";
import Image from 'next/image';

const TestiomonialAreaHomeTwo = () => {
  return (
    <>
      <div className="testimonial-section wow animate__slideInUp">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="section-title text-center wow animate__zoomIn">
                <div className="section-sub-title">
                  <h4>Our Testimonials</h4>
                </div>
                <div className="section-main-title ">
                  <h2>Words From Our Customer</h2>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <Swiper
             loop={true}
             modules={[Navigation, Pagination]}
             pagination={true}
             slidesPerView={3}
             spaceBetween={20}
             autoplay={{
               delay: 5000,
               disableOnInteraction: false
             }}
             breakpoints={{
               0: {
                 slidesPerView: 1,
                 spaceBetween: 20
               },
               576: {
                 slidesPerView: 1,
                 spaceBetween: 20
               },
               768: {
                 slidesPerView: 2,
                 spaceBetween: 20
               },
               992: {
                 slidesPerView: 3,
                 spaceBetween: 20
               },
               1200: {
                 slidesPerView: 3,
                 spaceBetween: 20
               }
             }}
             
             className="testi_list owl-carousel">
              {testiomonial_data.map((item, i) =>
                <SwiperSlide key={i} className="col-lg-12">
                  <div className="testi-item-box">
                    <div className="testi-content">
                      <div className="testi-icon-thumb">
                        <Image src={testi_icon} alt="image-title" />
                      </div>
                      <div className="testi-title">
                        <h4>{item.title}</h4>
                        <span>{item.category}</span>
                      </div>
                      <div className="testi-discription">
                        <p>{item.sm_des}</p>
                      </div>
                      <div className="testi-icon">
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                        <i className="bi bi-star-fill"></i>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>

              )}


              {/* <div className="col-lg-12">
                <div className="testi-item-box">
                  <div className="testi-content">
                    <div className="testi-icon-thumb">
                      <img src="assets/images/resource/testi-icon.png" alt="image-title" />
                    </div>
                    <div className="testi-title">
                      <h4>Lahiru Kumara</h4>
                      <span>Designer</span>
                    </div>
                    <div className="testi-discription">
                      <p>Lorem ipsum dolor sit amet, consectetur adipisicin elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim</p>
                    </div>
                    <div className="testi-icon">
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-12">
                <div className="testi-item-box">
                  <div className="testi-content">
                    <div className="testi-icon-thumb">
                      <img src="assets/images/resource/testi-icon.png" alt="image-title" />
                    </div>
                    <div className="testi-title">
                      <h4>Curtis Campher</h4>
                      <span>Designer</span>
                    </div>
                    <div className="testi-discription">
                      <p>Lorem ipsum dolor sit amet, consectetur adipisicin elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim</p>
                    </div>
                    <div className="testi-icon">
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-12">
                <div className="testi-item-box">
                  <div className="testi-content">
                    <div className="testi-icon-thumb">
                      <img src="assets/images/resource/testi-icon.png" alt="image-title" />
                    </div>
                    <div className="testi-title">
                      <h4>Barry McCarthy</h4>
                      <span>Designer</span>
                    </div>
                    <div className="testi-discription">
                      <p>Lorem ipsum dolor sit amet, consectetur adipisicin elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim</p>
                    </div>
                    <div className="testi-icon">
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-12">
                <div className="testi-item-box">
                  <div className="testi-content">
                    <div className="testi-icon-thumb">
                      <img src="assets/images/resource/testi-icon.png" alt="image-title" />
                    </div>
                    <div className="testi-title">
                      <h4>Lahiru Kumara</h4>
                      <span>Designer</span>
                    </div>
                    <div className="testi-discription">
                      <p>Lorem ipsum dolor sit amet, consectetur adipisicin elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim</p>
                    </div>
                    <div className="testi-icon">
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-12">
                <div className="testi-item-box">
                  <div className="testi-content">
                    <div className="testi-icon-thumb">
                      <img src="assets/images/resource/testi-icon.png" alt="image-title" />
                    </div>
                    <div className="testi-title">
                      <h4>Curtis Campher</h4>
                      <span>Designer</span>
                    </div>
                    <div className="testi-discription">
                      <p>Lorem ipsum dolor sit amet, consectetur adipisicin elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim</p>
                    </div>
                    <div className="testi-icon">
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-12">
                <div className="testi-item-box">
                  <div className="testi-content">
                    <div className="testi-icon-thumb">
                      <img src="assets/images/resource/testi-icon.png" alt="image-title" />
                    </div>
                    <div className="testi-title">
                      <h4>Barry McCarthy</h4>
                      <span>Designer</span>
                    </div>
                    <div className="testi-discription">
                      <p>Lorem ipsum dolor sit amet, consectetur adipisicin elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim</p>
                    </div>
                    <div className="testi-icon">
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-12">
                <div className="testi-item-box">
                  <div className="testi-content">
                    <div className="testi-icon-thumb">
                      <img src="assets/images/resource/testi-icon.png" alt="image-title" />
                    </div>
                    <div className="testi-title">
                      <h4>Lahiru Kumara</h4>
                      <span>Designer</span>
                    </div>
                    <div className="testi-discription">
                      <p>Lorem ipsum dolor sit amet, consectetur adipisicin elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim</p>
                    </div>
                    <div className="testi-icon">
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-12">
                <div className="testi-item-box">
                  <div className="testi-content">
                    <div className="testi-icon-thumb">
                      <img src="assets/images/resource/testi-icon.png" alt="image-title" />
                    </div>
                    <div className="testi-title">
                      <h4>Curtis Campher</h4>
                      <span>Designer</span>
                    </div>
                    <div className="testi-discription">
                      <p>Lorem ipsum dolor sit amet, consectetur adipisicin elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim</p>
                    </div>
                    <div className="testi-icon">
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-12">
                <div className="testi-item-box">
                  <div className="testi-content">
                    <div className="testi-icon-thumb">
                      <img src="assets/images/resource/testi-icon.png" alt="image-title" />
                    </div>
                    <div className="testi-title">
                      <h4>Barry McCarthy</h4>
                      <span>Designer</span>
                    </div>
                    <div className="testi-discription">
                      <p>Lorem ipsum dolor sit amet, consectetur adipisicin elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim</p>
                    </div>
                    <div className="testi-icon">
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                    </div>
                  </div>
                </div>
              </div> */}


            </Swiper>
          </div>
        </div>
      </div>
    </>
  );
};

export default TestiomonialAreaHomeTwo;