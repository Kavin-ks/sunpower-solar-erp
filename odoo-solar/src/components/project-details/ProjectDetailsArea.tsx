
import React from 'react';
import Image from 'next/image';

import project_details_img_1 from "@/assets/images/resource/project-details1.jpg";
import project_details_img_2 from "@/assets/images/resource/service3.png";
import { TeamSocialLinks } from '../common/SocialLinks';


interface DataType {
  title_1: string;
  sm_des: string;
  title_2: string;
  sm_info: string;
  feature: string[];
}


const project_content: DataType = {
  title_1: "Description of Situation",
  sm_des: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nul pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus e voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae",
  title_2: "client's goal",
  sm_info: "The result of employees, over 115 detailers and engineers, all coming together to solve probl before they arise. the teamwork it demonstrates both internally and externally is outstandingThe result of employees, over 115 detailers and engineers, all coming together to solve problem before they",
  feature: [
    "The triple pressures of more regulations outstanding in the creation.",
    "The legacy of the financial crisis has meant a few tricky years",
    "Now, the triple pressures of more regulations more regulations",
    "Outstanding in the creation he triple pressures of more regulations",
    "The triple pressures of more regulations outstanding in the creation",
  ]
}

const { title_1, sm_des, title_2, sm_info, feature } = project_content


const ProjectDetailsArea = () => {
  return (
    <>
      <div className="project-details-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 col-md-6">
              <div className="projetct-details-image">
                <Image src={project_details_img_1} style={{ height: "auto" }} alt="Service" />
              </div>
            </div>
            <div className="col-lg-6 col-md-6">
              <div className="info-area">
                <div className="sub-title">
                  <h5>information</h5>
                </div>
                <ul className="info">
                  <li>
                    <h6>project name:</h6>
                    <p>solar & exterior design</p>
                  </li>
                  <li>
                    <h6>client:</h6>
                    <p>theme pvt ltd</p>
                  </li>
                  <li>
                    <h6>category:</h6>
                    <p>commercial</p>
                  </li>
                  <li>
                    <h6>delivery mode:</h6>
                    <p>in hand delivery</p>
                  </li>
                  <li>
                    <h6>location:</h6>
                    <p>USA</p>
                  </li>

                  <li>
                    <h6>share:</h6>
                    <ul className="d-flex social_icon">
                      <TeamSocialLinks />
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-12">
              <div className="title">
                <h4>{title_1}</h4>
              </div>
              <p>{sm_des}</p>
            </div>
            <div className="col-lg-12 list-part">
              <div className="row align-items-end">
                <div className="col-lg-8 col-md-12">
                  <div className="title">
                    <h4>{title_2}</h4>
                  </div>
                  <p>{sm_info}</p>
                  <ul className="desc-list">
                    {feature.map((item, i) => (
                      <li key={i}><p>{item}</p></li>
                    ))} 
                  </ul>
                </div>
                <div className="col-lg-4 col-md-12">
                  <div className="image">
                    <Image src={project_details_img_2} style={{ height: "auto" }} alt="Service" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectDetailsArea;