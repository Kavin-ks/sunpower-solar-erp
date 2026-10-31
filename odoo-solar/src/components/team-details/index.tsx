
import HeaderOne from '@/layouts/headers/HeaderOne';
import React from 'react';
import Breadcrumb from '../common/breadcrumb/breadcrumb';
import FooterOne from '@/layouts/footers/FooterOne';
import TeamDetailsArea from './TeamDetailsArea';

const TeamDetails = () => {
  return (
    <>
      <HeaderOne />
      <main>
        <Breadcrumb top_title='Team Details' title='Team Details' />
        <TeamDetailsArea />
      </main>
      <FooterOne />
    </>
  );
};

export default TeamDetails;