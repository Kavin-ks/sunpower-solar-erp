
import ServiceDetails from '@/components/service-details';
import Wrapper from '@/layouts/Wrapper';
import React from 'react';

export const metadata = {
  title: 'On-Grid & Off-Grid Systems | Odoo Solar Power Company',
  description: 'In-depth guide to On-Grid net-metering solar systems, Off-Grid battery backup systems, and hybrid energy architectures with subsidy guidance.',
};

const index = () => {
  return (
    <Wrapper>
      <ServiceDetails />
    </Wrapper>
  );
};

export default index;