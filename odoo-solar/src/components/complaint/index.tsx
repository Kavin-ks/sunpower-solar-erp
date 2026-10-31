'use client';

import React from 'react';
import HeaderOne from '@/layouts/headers/HeaderOne';
import Breadcrumb from '../common/breadcrumb/breadcrumb';
import ComplaintArea from './ComplaintArea';
import FooterOne from '@/layouts/footers/FooterOne';

const Complaint = () => {
  return (
    <>
      <HeaderOne />
      <main>
        <Breadcrumb top_title="Customer Support" title="Warranty & Service Complaints" />
        <ComplaintArea />
      </main>
      <FooterOne />
    </>
  );
};

export default Complaint;
