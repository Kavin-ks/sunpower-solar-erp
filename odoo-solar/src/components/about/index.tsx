
import React from 'react';
import FooterOne from '@/layouts/footers/FooterOne';
import HeaderOne from '@/layouts/headers/HeaderOne';
import Breadcrumb from '../common/breadcrumb/breadcrumb';
import AboutAreaHomeOne from '../homes/home/AboutAreaHomeOne';
import ServiceAreaHomeOne from '../homes/home/ServiceAreaHomeOne';
import CtaAreaHomeOne from '../homes/home/CtaAreaHomeOne';
import TeamAreaHomeOne from '../homes/home/TeamAreaHomeOne';
import SubscribeAreaHomeOne from '../homes/home/SubscribeAreaHomeOne';

const About = () => {
  return (
    <>
      <HeaderOne />
      <main>
        <Breadcrumb top_title="About Us" title="About Us" />
        <AboutAreaHomeOne style={true} />
        <ServiceAreaHomeOne />
        <CtaAreaHomeOne />
        <TeamAreaHomeOne />
        <SubscribeAreaHomeOne />
      </main>
      <FooterOne />
    </>
  );
};

export default About;