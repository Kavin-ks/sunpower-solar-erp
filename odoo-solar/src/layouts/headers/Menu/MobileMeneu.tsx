"use client";
import React, { useState } from "react";
import menu_data from "./MenuData";
import Link from "next/link";

const MobileMeneu = () => {
  const [navTitle, setNavTitle] = useState("");
  //openMobileMenu
  const openMobileMenu = (menu: string) => {
    if (navTitle === menu) {
      setNavTitle("");
    } else {
      setNavTitle(menu);
    }
  };

  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mobile-menu-area sticky d-sm-block d-md-block d-lg-none ">
        <div className="mobile-menu mean-container">
          <div className="mean-bar">
            <a
              onClick={() => setOpen(!open)}
              className={`meanmenu-reveal ${open ? "meanclose" : ""}`}
              style={{
                right: "0px",
                left: "auto",
                textAlign: "center",
                textIndent: "0px",
                fontSize: "18px",
              }}
            >
              {open ?   
                'X'
                :
                <>
                  <span></span>
                  <span></span>
                  <span></span>
                </>
              }

            </a>
            <nav className="mean-nav">
              <ul className={`nav_scroll ${open ? "d-block" : "d-none"}`}>
                {menu_data.map((item, i) =>
                  <li key={i}>
                    <Link href={item.link}>{item.title}</Link>
                    {item.has_dropdown &&
                      <div className="sub-menu">
                        <ul style={{ display: navTitle === item.title ? "block" : "none", }}>
                          {item.sub_menus?.map((sub_item, index) =>
                            <li key={index}><Link href={sub_item.link}>{sub_item.title}</Link></li>
                          )}
                        </ul>
                        <a
                          className="mean-expand" onClick={() => openMobileMenu(item.title)}

                          style={{ fontSize: "18px", display: navTitle === item.title ? "mean-clicked" : "", }}
                        >
                           +
                        </a>
                      </div>
                    }
                  </li>
                )}
              </ul>
            </nav>
          </div> 
        </div>
      </div>
    </>
  );
};

export default MobileMeneu;
