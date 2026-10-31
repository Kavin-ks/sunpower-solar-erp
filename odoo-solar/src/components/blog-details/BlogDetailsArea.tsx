

import React from 'react';
import Image from 'next/image';
import BlogSidebar from '../blog/BlogSidebar';

import blog_thumb_1 from "@/assets/images/resource/blog-inner1.jpg";
import blog_thumb_2 from "@/assets/images/resource/blog-details.png";
import SocialLinks from '../common/SocialLinks';
import CommentsForm from '../forms/CommentsForm';

const blog_details_content = {
  author: "Endith Smith",
  date: "Aug 1, 2023", 
  title: "Energy Department Research Will Help Eagles Coexist with Wind Energy Deployment",
  sm_des_1: "ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dotore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip e commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dotoreg fugiat nullaariatur. Excepteur sint occaecat cupidatat non proident, sunt",
  sm_des_2: "ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dotore magna aliqua. Ut enim ad minim veniam",
  feature_list: [
    "Enhance your home's app",
    "More functional and simple",
    "Post Format Audio Blogs",
    "A Beautiful Sunday Morning",
    "In Mattis Scelerisque Magna",
    "Bibendum Sed Libero",
    "Pellentesque Mauris Nunc",
  ],
  title_2: "Energy Department Research Will Help Eagles",
  sm_des_3: "ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dotore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip e commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dotoreg fugiat nullaariatur. Excepteur sint occaecat cupidatat non proident, sunt",
  quote: "ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dotore magna aliqua. Ut enim ad minim veniam",

}

const { author, date, title, sm_des_1, sm_des_2, feature_list, title_2, sm_des_3, quote } = blog_details_content

const BlogDetailsArea = () => {
  return (
    <>
      <div className="blog-section style-three">
        <div className="container">
          <div className="row">

            <div className="col-lg-8 col-md-12">
              <div className="blog-items-box style-two">
                <div className="blog-thumb style-two">

                  <Image src={blog_thumb_1} style={{height: "auto"}} alt="image-title" />

                </div>
                <div className="blog-content style-two inner">
                  <div className="blog-meta style-two">
                    <span><i className="bi bi-person-fill"></i>{author}</span>
                    <span><i className="bi bi-calendar-month"></i>{date}</span>
                  </div>
                  <div className="blog-title">
                    <h4><a href="#">{title}</a></h4>
                  </div>
                  <div className="blog-disctiption">
                    <p>{sm_des_1}</p>
                     
                  </div>
                  <div className="blog-disctiption inner">
                    <p>  {sm_des_2}</p>
                  </div>
                  <div className="row">
                    <div className="col-lg-6 col-md-6">
                      <div className="blog-details-thumb">
                        <Image src={blog_thumb_2} style={{height: "auto"}} alt="image-title" />
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6">
                      <div className="blog-details-list">
                        <ul>
                          {feature_list.map((item, i) => (
                            <li key={i} className={`${i === 1 ? "active" : ""}`}><i className="bi bi-check2-circle"></i> {item}</li>
                          ))} 
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="blog-details-title">
                    <h5>{title_2}</h5>
                  </div>
                  <div className="blog-details-discription inner">
                    <p>{sm_des_3}</p>
                  </div>
                  <blockquote className="mb-30">
                    <p>{quote}</p>
                  </blockquote>
                  <div className="blog-details-title">
                    <h5>{title_2}</h5>
                  </div>
                  <div className="blog-details-discription inner">
                    <p>{sm_des_3}</p>
                  </div>
                  <div className="blog-details-social-box mb-60">
                    <div className="row align-items-center">
                      <div className="col-lg-6 col-md-6 col-6">
                        <div className="ba-blog-details-social-icons mb-10 mb-sm-0">
                          <h6>Share :</h6>
                          <SocialLinks /> 
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-6 col-6">
                        <div className="text-sm-end">
                          <div className="ba-blog-details-comment-count">
                            <i className="bi bi-chat-dots"></i>
                            <span>Comment (03)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ba-blog-details-comment">
                    <h5 className="ba-section-title-2 mb-50">
                      Recent Comments
                    </h5>
                    <div className="ba-blog-comment-list pb-60">
                      <ul>
                        <li>
                          <div className="ba-blog-comment-box">
                            <div className="image">
                              <img src="assets/images/resource/user1.png" alt="user image" />
                            </div>
                            <div className="content">
                              <div className="row">
                                <div className="col-lg-6 col-md-6">
                                  <h6 className="title">Richard Smith</h6>
                                  <span className="date">September 19, 2021</span>
                                </div>
                                <div className="col-lg-6 col-md-6">
                                  <div className="text-sm-end">
                                    <a className="replay-link" href="#">Replay</a>
                                  </div>
                                </div>
                              </div>
                              <div className="content-main">
                                <p>ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dotore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip e commodo consequat</p>
                              </div>
                            </div>
                          </div>
                          <ul>
                            <li>
                              <div className="ba-blog-comment-box inner">
                                <div className="image">
                                  <img src="assets/images/resource/user2.png" alt="user image" />
                                </div>
                                <div className="content">
                                  <div className="row pb-10">
                                    <div className=" col-lg-6 col-md-6">
                                      <h6 className="title">Laura Johnson</h6>
                                      <span className="date">April 20, 2022</span>
                                    </div>
                                    <div className="col-lg-6 col-md-6">
                                      <div className="text-sm-end">
                                        <a className="replay-link" href="#">Replay</a>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="content-main">
                                    <p>ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dotore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </li>
                          </ul>
                        </li>
                        <li>
                          <div className="ba-blog-comment-box inner-2">
                            <div className="image">
                              <img src="assets/images/resource/user3.png" alt="user image" />
                            </div>
                            <div className="content">
                              <div className="row pb-10">
                                <div className="col-lg-6 col-md-6">
                                  <h6 className="title">Richard Smith</h6>
                                  <span className="date">Jun 30, 2022</span>
                                </div>
                                <div className="col-lg-6 col-md-6">
                                  <div className="text-sm-end">
                                    <a className="replay-link" href="#">Replay</a>
                                  </div>
                                </div>
                              </div>
                              <div className="content-main">
                                <p>ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dotore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip e commodo consequat.</p>
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div> 

                  <div className="choose-contact-box inner">
                    <div className="choose-contact-title inner">
                      <h4>Leave A Comment</h4>
                    </div>

                    <CommentsForm />
                     
                  </div> 
                </div>
              </div>
            </div>

            <BlogSidebar /> 


          </div>
        </div>
      </div>
    </>
  );
};

export default BlogDetailsArea;