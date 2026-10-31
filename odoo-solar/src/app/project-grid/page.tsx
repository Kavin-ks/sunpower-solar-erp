
import ProjectGrid from '@/components/project-grid';
import Wrapper from '@/layouts/Wrapper';
import React from 'react';

export const metadata = {
  title: 'Project Grid - SolerPanel-Solar & Renewable Energy React Next js Template',
  description: 'The Solar Panel React Next js template is a modern and responsive design specifically created for websites related to solar energy and renewable energy solutions',
}



const index = () => {
  return (
    <Wrapper>
      <ProjectGrid />
    </Wrapper>
  );
};

export default index;