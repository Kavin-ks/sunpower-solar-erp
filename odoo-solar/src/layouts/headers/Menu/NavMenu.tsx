
import React from 'react';
import Link from 'next/link';
import menu_data from './MenuData';

const NavMenu = () => {
  return (
    <>
      <ul>
        {menu_data.map((item, i) => (
          <li key={i}>
            <Link href={item.link}>{item.title} {item.has_dropdown ? <i className="fas fa-chevron-down"></i> : null}</Link>
            {item.has_dropdown &&
              <div className="sub-menu">
                <ul>
                  {item.sub_menus?.map((sub_item, index) =>
                    <li key={index}><Link href={sub_item.link}>{sub_item.title}</Link></li>
                  )}
                </ul>
              </div>
            }
          </li>
        ))}
      </ul>
    </>
  );
};

export default NavMenu;