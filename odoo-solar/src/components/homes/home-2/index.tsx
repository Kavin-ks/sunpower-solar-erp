import React from 'react'; 
import HeroAreaHomeTwo from './HeroAreaHomeTwo';
import AboutAreaHomeTwo from './AboutAreaHomeTwo';
import OfferAreaHomeTwo from './OfferAreaHomeTwo';
import CtaAreaHomeOne from '../home/CtaAreaHomeOne';
import TeamAreaHomeOne from '../home/TeamAreaHomeOne';
import VedioAreaHomeOne from '../home/VedioAreaHomeOne';
import ContactAreaHomeOne from '../home/ContactAreaHomeOne';
import TestiomonialAreaHomeTwo from './TestiomonialAreaHomeTwo';
import CtaAreaHomeTwo from './CtaAreaHomeTwo';
import BlogAreaHomeOne from '../home/BlogAreaHomeOne';
import SubscribeAreaHomeOne from '../home/SubscribeAreaHomeOne';
import FooterOne from '@/layouts/footers/FooterOne';
import HeaderOne from '@/layouts/headers/HeaderOne';

const HomeTwo = () => {
  return (
    <> 
      <HeaderOne />
      <main>
        {/* 1. Hero Slide */}
        <HeroAreaHomeTwo />

        {/* 2. Make an Appointment Form (Placed right here at the second slide, above Our Introduction) */}
        <ContactAreaHomeOne />

        {/* 3. Our Introduction / About Section */}
        <AboutAreaHomeTwo />

        {/* 4. Services & Offers */}
        <OfferAreaHomeTwo />

        {/* 5. Call to Action */}
        <CtaAreaHomeOne />

        {/* 6. 15-Crew Technicians Team */}
        <TeamAreaHomeOne style={true} />

        {/* 7. Video Showcase */}
        <VedioAreaHomeOne style={true} />

        {/* 8. Testimonials */}
        <TestiomonialAreaHomeTwo />

        {/* 9. Second CTA Banner */}
        <CtaAreaHomeTwo />

        {/* 10. Solar Blog & Knowledge */}
        <BlogAreaHomeOne />

        {/* 11. Newsletter Subscribe */}
        <SubscribeAreaHomeOne />
      </main>
      <FooterOne />
    </>
  );
};

export default HomeTwo;