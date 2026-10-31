'use client'
import project_data from '@/data/ProjectData';
import Image from 'next/image';
import React, { useState } from 'react';

// data
const categories = ["All", ...new Set(project_data.map((item) => item.category))];

const perView = 6;

const ProjectGridArea = () => {

  const [activeCategory, setActiveCategory] = useState("All");
  const [items, setItems] = useState(project_data);
  const [next, setNext] = useState(perView);

  const filterItems = (cateItem: string) => {
    setActiveCategory(cateItem);
    setNext(perView);
    if (cateItem === "All") {
      return setItems(project_data);
    } else {
      const findItems = project_data.filter((findItem) => {
        return findItem.category == cateItem;
      });
      setItems(findItems);
    }
  };
  //   handleLoadMore
  const handleLoadMore = () => {
    setNext((value) => value + 3);
  };

  return (
    <>
      <div className="project-grid-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="protfolio-nav text-center">
                <div className="protfolio-menu">
                  <ul className="menu-filtering">

                    {categories.map((cate, i) => (
                      <React.Fragment key={i}>
                        <li
                          onClick={() => filterItems(cate)}
                          className={`${cate === activeCategory ? "active" : ""} current_menu_item`}
                        >
                          {cate}
                        </li>  {' '}
                      </React.Fragment>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="row image_load">

            {items.slice(0, next).map((item, i) => (
              <div key={i} className="col-lg-4 col-md-6 grid-item physics math mb-30">
                <div className="project-grid-box">
                  <div className="project-thumb">
                    <Image src={item.img} style={{ height: "auto" }} alt="image-title" />
                  </div>
                  <div className="project-content">
                    <h4>{item.title}</h4>
                    <span>{item.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {next < items.length &&
            <div className="load-more">
              <button className="load-more-btn" onClick={handleLoadMore}>Load More</button>
            </div>
          }
        </div>
      </div>

    </>
  );
};

export default ProjectGridArea;