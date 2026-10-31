
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

type DataType = {
  top_title: string;
  title: string;
}
const Breadcrumb = ({ top_title, title }: DataType) => {
  return (
    <>
      <div className="breatcome-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12">
              <div className="breatcome-content">
                <div className="breatcome-title">
                  <h1>{top_title}</h1>
                </div>
                <div className="bratcome-text">
                  <ul>
                    <li><Link href="/">Home</Link></li>
                    <li>{title}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Breadcrumb;