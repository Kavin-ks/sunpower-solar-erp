'use client';
import React from 'react';

const SearchPopup = ({ searchPopup, setSearchPopup }: any) => {
  return (
    <>
      <div className={`${searchPopup ? 'search-active' : ''}`}>
        <div className="search-popup">
          <button className="close-search style-two" onClick={() => setSearchPopup(false)}>
            <span className="flaticon-multiply"><i className="far fa-times-circle"></i></span>
          </button>
          <button className="close-search" onClick={() => setSearchPopup(false)}><i className="fas fa-arrow-up"></i></button>
          <form onSubmit={e => e.preventDefault()}>
            <div className="form-group">
              <input type="search" name="search-field"  placeholder="Search Here" />
              <button type="submit"><i className="fa fa-search"></i></button>
            </div>
          </form>
        </div>

      </div>
    </>
  );
};

export default SearchPopup;