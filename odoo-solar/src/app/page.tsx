import HomeTwo from '@/components/homes/home-2';
import Wrapper from '@/layouts/Wrapper';
import React from 'react';

export const metadata = {
  title: 'Odoo Solar Power Company — Solar & Renewable Energy Solutions',
  description: 'Complete rooftop solar installation, certified 1kW to 5kW systems, and turnkey EPC solar energy solutions.',
};

const MainHome = () => {
  return (
    <Wrapper>
      <HomeTwo />
    </Wrapper>
  );
};

export default MainHome;