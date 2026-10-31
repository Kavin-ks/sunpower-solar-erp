'use client';
import React, { useEffect, useState } from 'react';
import Image from "next/image";

import about_thumb from "@/assets/images/about/about-thumb2.png";
import VideoPopup from '@/modals/VideoPopup';

const about_content = {

}

const AboutAreaHomeTwo = () => {
  const [isVideoOpen, setIsVideoOpen] = useState<boolean>(false);


  const [bar1Width, setBar1Width] = useState('90%');
  const [bar2Width, setBar2Width] = useState('69%');
  const [bar3Width, setBar3Width] = useState('59%');

  useEffect(() => { 
    setTimeout(() => {
      setBar1Width('90%');
      setBar2Width('69%');
      setBar3Width('59%');
    }, 1000);  
  }, []);


 




  return (
    <>
      <div className="about-section style-two">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 col-md-12">
              <div className="about-thumb wow animate__zoomIn">
                <Image src={about_thumb} style={{ height: "auto" }} alt="image-title" />
                <div className="about-video-icon">
                  <a className="video-vemo-icon venobox vbox-item"
                    onClick={() => setIsVideoOpen(true)}
                    style={{ cursor: "pointer" }}
                  >
                    <i className="bi bi-play"></i>
                  </a>
                </div>
                <div className="about-counter-two style-two wow animate__slideInLeft">
                  <div className="about-number-two style-two">
                    <h4 className="counter">25</h4>
                  </div>
                  <div className="about-counter-content">
                    <h5>Years Of Experience We Just Achieved</h5>
                  </div>
                </div>
              </div>
            </div>



            <div className="col-lg-6 col-md-12">
              <div className="about-section-title wow animate__slideInDown">
                <div className="about-section-sub-title">
                  <h4>Our Introduction</h4>
                </div>
                <div className="about-section-main-title">
                  <h2>We Are Pioneers In The World Of Solar Energy!</h2>
                </div>
              </div>
              <div className="about-content-description wow animate__zoomIn">
                <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
                  laudantium, totam aperiam, eaquecy epsa abillo inventore veritatis architecto beatae</p>
              </div>

              <div className="process-ber-plugin wow animate__zoomIn">
                <span className="process-bar">Business Success</span>
                <div id="bar1" className="barfiller"> 
                  <span className="fill" data-percentage="90" style={{ background: 'rgb(22, 181, 151)', width: bar1Width, transition: 'width 7s ease-in-out 0s' }}></span>
                </div>
                <span className="process-bar">Install Solar Energy Panel</span>
                <div id="bar2" className="barfiller"> 
                  <span className="fill my-className" data-percentage="69" style={{ background: 'rgb(22, 181, 151)', width: bar2Width, transition: 'width 7s ease-in-out 0s' }}></span>
                </div>
                <span className="process-bar">Solar Production Energy</span>
                <div id="bar3" className="barfiller"> 
                  <span className="fill my-className" data-percentage="59" style={{ background: 'rgb(22, 181, 151)', width: bar3Width, transition: 'width 7s ease-in-out 0s' }}></span>
                </div>
              </div> 
 

              <div className="solar-btn about about2 wow animate__slideInUp">
                <a href="#">Get A Quote <i className="bi bi-arrow-right"></i></a>
              </div>
            </div>


          </div>
        </div>
      </div>

      {/* video modal start */}
      <VideoPopup
        isVideoOpen={isVideoOpen}
        setIsVideoOpen={setIsVideoOpen}
        videoId={"TCHq0O5rMcM"}
      />
      {/* video modal end */}

    </>
  );
};

export default AboutAreaHomeTwo;
