

import Service from '@/components/service';
import Wrapper from '@/layouts/Wrapper';
import React from 'react';


export const metadata = {
  title: '1kW–5kW Solar Packages | Odoo Solar Power Company',
  description: 'Standardized 1kW to 5kW On-Grid and Off-Grid rooftop solar systems with automated Bill of Materials, 20-year warranty, and PM Surya Ghar subsidies.',
};

const index = () => {
  return (
    <Wrapper>
      <Service />
    </Wrapper>
  );
};

export default index;