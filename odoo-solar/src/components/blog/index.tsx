
import React from 'react';
import HeaderOne from '@/layouts/headers/HeaderOne';
import Breadcrumb from '../common/breadcrumb/breadcrumb';
import BlogArea from './BlogArea';
import FooterOne from '@/layouts/footers/FooterOne';

const Blog = () => {
  return (
    <>
    <HeaderOne />
    <main>
      <Breadcrumb top_title='Blog' title='Blog' />
      <BlogArea />
    </main>
    <FooterOne />
      
    </>
  );
};

export default Blog;