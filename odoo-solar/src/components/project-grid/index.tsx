
import React from 'react';
import HeaderOne from '@/layouts/headers/HeaderOne';
import Breadcrumb from '../common/breadcrumb/breadcrumb';
import ProjectGridArea from './ProjectGridArea';
import SubscribeAreaHomeOne from '../homes/home/SubscribeAreaHomeOne';
import FooterOne from '@/layouts/footers/FooterOne';

const ProjectGrid = () => {
  return (
    <>
      <HeaderOne />
      <main>
        <Breadcrumb top_title="Project Grid" title="Project Grid" />
        <ProjectGridArea />
        <SubscribeAreaHomeOne />
      </main>
      <FooterOne />
    </>
  );
};

export default ProjectGrid;