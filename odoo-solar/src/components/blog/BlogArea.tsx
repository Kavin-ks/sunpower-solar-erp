
import blog_data from '@/data/BlogData';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import blog_shape from "@/assets/images/resource/blog-shape.png";
import BlogSidebar from './BlogSidebar';


const BlogArea = () => {
  return (
    <>
      <div className="blog-section style-two">
        <div className="container">
          <div className="row">

            <div className="col-lg-8 col-md-12">
              {blog_data.map((item, i) =>
                <div key={i} className="blog-items-box style-two">
                  <div className="blog-thumb style-two">
                    <Image src={item.thumb} style={{ height: "auto" }} alt="image-title" />
                  </div>
                  <div className="blog-content style-two">
                    <div className="blog-meta style-two">
                      <span><i className="bi bi-eye"></i> Viwe {item.view}</span>
                      <span><i className="bi bi-wechat"></i>Comments {item.comment}</span>
                    </div>
                    <div className="blog-title style-two">
                      <h4><Link href="/blog-details">{item.title}</Link></h4>
                    </div>
                    <div className="blog-disctiption">
                      <p>{item.sm_des}</p>
                    </div>
                    <div className="blog-bottom-shape style-two">
                      <Image src={blog_shape} alt="image-title" />
                    </div>
                    <div className="blog-bottom-title style-two">
                      <h5>{item.author}</h5>
                    </div>
                    <div className="blog-btn style-two">
                      <Link href="/blog">More Details <i className="bi bi-arrow-up-right"></i></Link>
                    </div>
                  </div>
                </div>
              )}


              <div className="as-pagination text-center">
                <ul>
                  <li><Link href="/blog-details"><i className="bi bi-chevron-double-left"></i></Link></li>
                  <li><Link href="/blog-details">1</Link></li>
                  <li><Link href="/blog-details">2</Link></li>
                  <li><Link href="/blog-details">3</Link></li>
                  <li><Link href="/blog-details"><i className="bi bi-chevron-double-right"></i></Link></li>
                </ul>
              </div>
            </div>

            <BlogSidebar />

          </div>
        </div>
      </div>
    </>
  );
};

export default BlogArea;