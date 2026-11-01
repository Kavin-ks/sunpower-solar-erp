
import React from 'react';
import Image, { StaticImageData } from 'next/image';

import { TeamSocialLinks } from '@/components/common/SocialLinks';
import team_data from '@/data/TeamData';


interface DataType  {
  subtitle: string;
  title: string; 
}

const team_content: DataType = {
  subtitle: "Our Team Members",
  title: "Meet Experience Team",
}
const { subtitle, title } = team_content

const TeamAreaHomeOne = ({style, style_2}: any) => {
	const team_membets = team_data.filter(item => item.path === "home_1")

	const teams = style_2 ? team_data : team_membets
	


  return (
    <>
      <div className="team-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="section-title text-center wow animate__slideInUp">
                <div className="section-sub-title">
                  <h4>{subtitle}</h4>
                </div>
                <div className="section-main-title ">
                  <h2>{title}</h2>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            {teams.map((item, i) => (
              <div key={i} className="col-lg-3 col-md-6">
                <div className="team-items-box">
                  <div className="team-thumb wow animate__slideInDown">
                    <Image src={item.avatar} style={{width: "100%", height: "auto"}} alt="image-title" />
                    <div className={`team-icon ${style? "style-two" : ""}`}>
                      <ul>
                        <TeamSocialLinks /> 
                      </ul>
                    </div>
                    <div className={`team-main-icon ${style? "style-two" : ""}`}>
                      <a href="#"><i className={`${style? "bi bi-dash" : "bi bi-plus"}`}></i></a>
                    </div>
                    <div className="team-content">
                      <h4><a href="team-details.html">Roten Barsaw</a></h4>
                      <span>Chief Engineer</span>
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

export default TeamAreaHomeOne;

