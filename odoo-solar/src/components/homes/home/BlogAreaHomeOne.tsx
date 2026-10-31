
import React from 'react';
import Link from 'next/link';
import Image, { StaticImageData } from 'next/image';

import blog_thumb_1 from "@/assets/images/resource/blog1.png";
import blog_thumb_2 from "@/assets/images/resource/blog2.png";
import blog_thumb_3 from "@/assets/images/resource/blog3.png";

interface DataType  {
  subtitle: string;
  title: string;
  blog_data: {
      id: number;
      thumb: StaticImageData;
      date: string;
      title: string;
      author: string;
      comment: string;
      total_comment: number;
  }[];
}

const blog_content:DataType = {
  subtitle: "Latest News & Bolg",
  title: "Latest News & Articals",
  blog_data: [
    {
      id: 1,
      thumb: blog_thumb_1,
      date: "Octobor 3, 2023",
      title: "Powering Asia Pacific's Energy Transition",
      author: "Bradley R Grady",
      comment: "Post a Comment",
      total_comment: 155,
    },
    {
      id: 2,
      thumb: blog_thumb_2,
      date: "Octobor 3, 2023",
      title: "Powering Asia Pacific's Energy Transition",
      author: "Bradley R Grady",
      comment: "Post a Comment",
      total_comment: 104,
    },
    {
      id: 3,
      thumb: blog_thumb_3,
      date: "Octobor 3, 2023",
      title: "Powering Asia Pacific's Energy Transition",
      author: "Bradley R Grady",
      comment: "Post a Comment",
      total_comment: 94,
    },

  ]
}

const { subtitle, title, blog_data } = blog_content;

const BlogAreaHomeOne = () => {
  return (
    <>
      <div className="blog-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="section-title text-center wow animate__slideInUp">
                <div className="section-sub-title">
                  <h4>{subtitle}</h4>
                </div>
                <div className="section-main-title blog ">
                  <h2>{title}</h2>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            {blog_data.map((item, i) => (
              <div key={i} className="col-lg-4 col-md-6">
                <div className={`blog-items-box wow animate__${i === 0 ? "slideInDown" : i === 1 ? "slideInUp" : "slideInDown"}`}>
                  <div className="blog-thumb">
                    <Image src={item.thumb} style={{height: "auto"}} alt="image-title" />
                  </div>
                  <div className="blog-date">
                    <span><i className="bi bi-calendar3"></i>{item.date}</span>
                  </div>
                  <div className="blog-content">
                    <div className="blog-meta">
                      <span><i className="bi bi-eye"></i> Viwe {item.total_comment}</span>
                      <span><i className="bi bi-wechat"></i> {item.comment}</span>
                    </div>
                    <div className="blog-title">
                      <h4><Link href="/blog-details">{item.title}</Link></h4>
                    </div>
                    <div className="blog-bottom-shape">
                      <img src="assets/images/resource/blog-shape.png" alt="image-title" />
                    </div>
                    <div className="blog-bottom-title">
                      <h5>{item.author}</h5>
                    </div>
                    <div className="blog-btn">
                      <Link href="/blog">More Details <i className="bi bi-arrow-up-right"></i></Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogAreaHomeOne;