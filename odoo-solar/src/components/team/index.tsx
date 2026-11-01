
import HeaderOne from '@/layouts/headers/HeaderOne';
import React from 'react';
import Breadcrumb from '../common/breadcrumb/breadcrumb';
import FooterOne from '@/layouts/footers/FooterOne';
import TeamAreaHomeOne from '../homes/home/TeamAreaHomeOne';
import SubscribeAreaHomeOne from '../homes/home/SubscribeAreaHomeOne';

const Team = () => {
  return (
    <>
      <HeaderOne />
      <main>
        <Breadcrumb top_title='Team' title='Team' />
        <TeamAreaHomeOne style_2={true} />
        <SubscribeAreaHomeOne />
      </main>
      <FooterOne />
    </>
  );
};

export default Team;