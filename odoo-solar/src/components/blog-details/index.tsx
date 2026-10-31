

import React from 'react';
import HeaderOne from '@/layouts/headers/HeaderOne';
import Breadcrumb from '../common/breadcrumb/breadcrumb';
import BlogDetailsArea from './BlogDetailsArea';
import FooterOne from '@/layouts/footers/FooterOne';

const BlogDetails = () => {
  return (
    <>
      <HeaderOne />
      <main>
        <Breadcrumb top_title='Blog Details' title='Blog Details' />
        <BlogDetailsArea />
      </main>
      <FooterOne />
    </>
  );
};

export default BlogDetails;