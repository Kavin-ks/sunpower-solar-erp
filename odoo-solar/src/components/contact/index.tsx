

import React from 'react';
import HeaderOne from '@/layouts/headers/HeaderOne';
import Breadcrumb from '../common/breadcrumb/breadcrumb';
import ContactArea from './ContactArea';
import MapArea from './MapArea';
import FooterOne from '@/layouts/footers/FooterOne';

const Contact = () => {
  return (
    <>
      <HeaderOne />
      <main>
        <Breadcrumb top_title='Contact' title='Contact' />
        <ContactArea />
        <MapArea />
      </main>
      <FooterOne />
    </>
  );
};

export default Contact;