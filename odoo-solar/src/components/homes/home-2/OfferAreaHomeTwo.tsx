
import React from 'react';
import Image, { StaticImageData } from 'next/image';


import offer_thumb from "@/assets/images/resource/offer-thumb.png";

import offer_icon_1 from "@/assets/images/resource/offer-icon1.png";
import offer_icon_2 from "@/assets/images/resource/offer-icon2.png";
import offer_icon_3 from "@/assets/images/resource/offer-icon3.png";
import offer_icon_4 from "@/assets/images/resource/offer-icon4.png";
import offer_icon_5 from "@/assets/images/resource/offer-icon5.png";
import offer_icon_6 from "@/assets/images/resource/offer-icon6.png";

interface DataType  {
  subtitle: string;
  title: string;
  feature: {
      icon: StaticImageData;
      anim: string;
      title: string;
      sm_des: string;
  }[];
}


const offer_content: DataType = {
  subtitle: "What We Offer",
  title: "Few Reasons to Choose Us",
  feature: [
    {
      icon: offer_icon_1,
      anim: "slideInRight",
      title: "Battery Storage",
      sm_des: "Solar PV, Battery Storage Heat Recovery",
    },
    {
      icon: offer_icon_2,
      anim: "slideInLeft",
      title: "Energy Around",
      sm_des: "Solar PV, Battery Storage Heat Recovery",
    },
    {
      icon: offer_icon_3,
      anim: "slideInRight",
      title: "Solar PV Systems",
      sm_des: "Solar PV, Battery Storage Heat Recovery",
    },
    {
      icon: offer_icon_4,
      anim: "slideInUp",
      title: "Technical Service",
      sm_des: "Solar PV, Battery Storage Heat Recovery",
    },
    {
      icon: offer_icon_5,
      anim: "zoomIn",
      title: "Wind Generators",
      sm_des: "Solar PV, Battery Storage Heat Recovery",

    },
    {
      icon: offer_icon_6,
      anim: "slideInDown",
      title: "Inspection skill",
      sm_des: "Solar PV, Battery Storage Heat Recovery",
    },
  ],
}
const { subtitle, title, feature } = offer_content;


const OfferAreaHomeTwo = () => {
  return (
    <>
      <div className="offer-section style-two">
        <div className="container">
          <div className="row">
            <div className="col-lg-7 col-md-12">
              <div className="section-title wow animate__slideInDown">
                <div className="section-sub-title offer">
                  <h4>{subtitle}</h4>
                </div>
                <div className="section-main-title offer">
                  <h2>{title}</h2>
                </div>
              </div>
              <div className="row inner">
                {feature.map((item, i) => (
                  <div key={i} className="col-lg-4 col-md-4 col-sm-6 col-6">
                    <div className={`offer-items-box wow animate__${item.anim}`}>
                      <div className="offer-icon-thumb">
                        <Image src={item.icon} alt="image-title" />
                      </div>
                      <div className="offer-content">
                        <h4>{item.title}</h4>
                        <p>{item.sm_des}</p>
                      </div>
                    </div>
                  </div>
                ))} 

              </div>
            </div>
            <div className="col-lg-5 col-md-12 pl-0">
              <div className="offer-thumb wow animate__slideInUp">
                <Image src={offer_thumb} style={{height: 'auto'}} alt="image-title" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OfferAreaHomeTwo;