import Complaint from '@/components/complaint';
import Wrapper from '@/layouts/Wrapper';
import React from 'react';

export const metadata = {
  title: 'Customer Support & Warranty Complaints - SunPower Solutions',
  description: 'Submit solar breakdown service complaints, verify product warranty, track technician visits, and sign off on restored solar generation.',
};

const ComplaintPage = () => {
  return (
    <Wrapper>
      <Complaint />
    </Wrapper>
  );
};

export default ComplaintPage;
