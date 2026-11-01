'use client';
import React, { useEffect, useState } from 'react';
import CommentFormTeam from '../forms/CommentFormTeam';
import SocialLinks from '../common/SocialLinks';

const TeamDetailsArea = () => {

  const [bar1Width, setBar1Width] = useState('70%');
  const [bar2Width, setBar2Width] = useState('60%');
  const [bar3Width, setBar3Width] = useState('87%');
  const [bar4Width, setBar4Width] = useState('50%');
  const [bar5Width, setBar5Width] = useState('60%');

  useEffect(() => {
    setTimeout(() => {
      setBar1Width('70%');
      setBar2Width('60%');
      setBar3Width('87%');
    }, 1000);
  }, []);


  return (
    <>
      <div className="team-details-section">
        <div className="container">
          <div className="row">
            <div className="col-xxl-8 col-xl-8">
              <div className="ba-team-details-author-skill-area pb-20 pb-xl-0">
                <div className="row">
                  <div className="col-lg-6 col-md-6">
                    <div className="team-details-author-img">
                      <img src="assets/images/team/team-details-thumb.png" alt="image" />
                    </div>
                  </div>
                  <div className=" col-lg-6 col-md-6">
                    <div className="team-details-author-content">
                      <div className="team-details-author-name">
                        <h5>Archer Graham</h5>
                        <span>Graphice Designer</span>
                      </div>
                      <div className="team-details-author-experience">
                        <ul>
                          <li>
                            <span className="label">Position:</span>
                            <span className="value">Solar Panel</span>
                          </li>
                          <li>
                            <span className="label">Practice Area:</span>
                            <span className="value">Family Lawyer, Criminal Defence</span>
                          </li>
                          <li>
                            <span className="label">Experience:</span>
                            <span className="value">12 Years</span>
                          </li>
                          <li>
                            <span className="label">Address:</span>
                            <span className="value">Odoo Solar System, Geethanjali college of engineering, hyderabad</span>
                          </li>
                          <li>
                            <span className="label">Phone:</span>
                            <span className="value"><a href="tel:7010818264">+91 7010818264</a></span>
                          </li>
                          <li>
                            <span className="label">Email:</span>
                            <a href="mailto:Odoo@gmail.com" className="value">Odoo@gmail.com</a>
                          </li>
                          <li>
                            <span className="label">Website:</span>
                            <a href="yourwebsitehere.com" className="value">yourwebsitehere.com</a>
                          </li>
                          <li>
                            <span className="label">Fax: </span>
                            <a className="value" href="tel:568746987">568 746 987</a>
                          </li>
                        </ul>
                      </div>
                      <div className="team-card-box-social">
                        <SocialLinks />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            <div className="col-lg-4 col-md-12">
              <div className="process-ber-plugin">
                <span className="process-bar style-two">Customer Satisficed </span>
                <div id="bar1" className="barfiller style-two">
                  <span className="fill" data-percentage="70"
                    style={{ background: 'rgb(22, 181, 151)', width: bar1Width, transition: 'width 7s ease-in-out 0s' }}></span>
                </div>
                <span className="process-bar style-two">Customer Satisficed</span>
                <div id="bar2" className="barfiller style-two">
                  <span className="fill my-className" data-percentage="60"
                    style={{ background: 'rgb(22, 181, 151)', width: bar2Width, transition: "width 7s ease-in-out 0s" }}></span>
                </div>
                <span className="process-bar style-two">Customer Satisficed</span>
                <div id="bar3" className="barfiller style-two">
                  <span className="fill my-className" data-percentage="87"
                    style={{ background: 'rgb(22, 181, 151)', width: bar3Width, transition: 'width 7s ease-in-out 0s' }}></span>
                </div>
                <span className="process-bar style-two">Customer Satisficed</span>
                <div id="bar4" className="barfiller style-two">
                  <span className="fill my-className" data-percentage="50"
                    style={{ background: 'rgb(22, 181, 151)', width: bar4Width, transition: 'width 7s ease-in-out 0s' }}></span>
                </div>
                <span className="process-bar style-two">Customer Satisficed</span>
                <div id="bar5" className="barfiller style-two"> 

                  <span className="fill my-className" data-percentage="60"
                    style={{ background: 'rgb(22, 181, 151)', width: bar5Width, transition: 'width 7s ease-in-out 0s' }}></span>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6 col-md-12">
              <div className="team-details-content">
                <div className="team-details-title">
                  <h4>Personal Experience</h4>

                </div>
                <div className="team-details-discription">
                  <p>Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere , omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus.
                  </p>
                  <p>Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut</p>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-12">
              <div className="choose-contact-box inner team">
                <div className="choose-contact-title inner team">
                  <h4>Leave A Comment</h4>
                </div>

                <CommentFormTeam />

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeamDetailsArea;