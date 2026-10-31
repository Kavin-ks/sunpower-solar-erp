
import About from '@/components/about';
import Wrapper from '@/layouts/Wrapper';
import React from 'react';

export const metadata = {
  title: 'About - SolerPanel-Solar & Renewable Energy React Next js Template',
  description: 'The Solar Panel React Next js template is a modern and responsive design specifically created for websites related to solar energy and renewable energy solutions',
}

const index = () => {
  return (
    <Wrapper>
      <About />
    </Wrapper>
  );
};

export default index;