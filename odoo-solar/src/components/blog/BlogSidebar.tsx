'use client';
import React from 'react';
import Image, { StaticImageData } from 'next/image';

import post_thumb_1 from "@/assets/images/resource/recent1.png";
import post_thumb_2 from "@/assets/images/resource/recent2.png";
import post_thumb_3 from "@/assets/images/resource/recent3.png";
import Link from 'next/link';



interface DataType {
  categories: {
      title: string;
      items: string;
  }[];
  latest_posts: {
      img: StaticImageData;
      title: string;
      date: string;
  }[];
  tags: string[];
}

const blog_sidebar_data: DataType = {
  categories: [ 
    {title: "Commercial Building", items: "09"},
    {title: "Installation", items: "10"},
    {title: "Renewable Energy", items: "45"},
    {title: "Solar Energy", items: "19"},
    {title: "Wind Generators", items: "10"},
    {title: "Financial Investment", items: "34"},
    {title: "Solar Panels", items: "76"},
  ],
  latest_posts: [
    {img: post_thumb_1,title:  "This Place Really Place For", date: "July 24"},
    {img: post_thumb_2,title:  "When Two Wheels Better Than", date: "July 24"},
    {img: post_thumb_3,title:  "This Place Really Place For", date: "July 24"},     
  ],
  tags: ["Energy", "Mobile","Solar","Business","Insights","Roofing","Systems",]

}

const {categories, latest_posts, tags} = blog_sidebar_data

const BlogSidebar = () => {
  return (
    <>

      <div className="col-lg-4 col-md-6">
        <div className="widget_search mb-30">
          <form onSubmit={e => e.preventDefault()}>
            <input type="text" name="s" value="" placeholder="Search Here" title="Search for:" />
            <button type="submit" className="icons">
              <i className="fa fa-search"></i>
            </button>
          </form>
        </div>
        <div className="widget-categories-box">
          <div className="categories-title">
            <h4> Categories </h4>
          </div>
          <div className="widget-categories-menu">
            <ul>
              {categories.map((item, i) =>
                <li key={i}><Link href="/service-details" style={{color: 'black'}}>{item.title} <span>({item.items})</span></Link></li>
              )} 
            </ul>
          </div>
        </div>
        <div className="widget-categories-box">
          <div className="categories-title">
            <h4> Latest Post </h4>
          </div>
          {latest_posts.map((item, i) =>
            <div className="sidber-widget-recent-post" key={i}>
              <div className="recent-widget-thumb">
                <Image src={item.img} alt="image-title" />
              </div>
              <div className="recent-widget-content">
                <a href="#">{item.title}</a>
                <span><i className="bi bi-calendar-event"></i> 
                {new Date().toLocaleString('default', { month: 'long' })} {new Date().getDate()} {new Date().getFullYear()}</span>
              </div>
            </div>
          )} 

        </div>
        <div className="widget-categories-box">
          <div className="categories-title">
            <h4> Tag Cloud </h4>
          </div>
          <div className="widget-tags">
            {tags.map((item, i) =>
              <Link href="#" key={i}>{item}</Link>
            )} 
          </div>
        </div>
        <div className="ba-blog-widget">
          <h4 className="ba-blog-widget-title">Newsletter</h4>
          <div className="ba-blog-widget-subscribe-form">
            <form onSubmit={e => e.preventDefault()}>
              <input type="text" placeholder="Newsletter" />
              <button type="submit"><i className="bi bi-envelope"></i></button>
            </form>
          </div>
        </div>
      </div>

    </>
  );
};

export default BlogSidebar;