
import React from 'react';
import HeaderOne from '@/layouts/headers/HeaderOne';
import Breadcrumb from '../common/breadcrumb/breadcrumb';
import FooterOne from '@/layouts/footers/FooterOne';
import FaqArea from './FaqArea';

const Faq = () => {
  return (
    <>
      <HeaderOne />
      <main>
        <Breadcrumb top_title='Faq' title='Faq' /> 
        <FaqArea />
      </main>
      <FooterOne />
    </>
  );
};

export default Faq;