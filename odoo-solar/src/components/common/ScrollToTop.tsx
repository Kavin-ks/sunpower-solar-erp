"use client"
import UseSticky from "@/hooks/UseSticky";
import React, { useState, useEffect } from "react";


const ScrollToTop = () => {
  const { sticky }: { sticky: boolean } = UseSticky();

  const [showScroll, setShowScroll] = useState(false);

  const checkScrollTop = () => {
    if (!showScroll && window.pageYOffset > 400) {
      setShowScroll(true);
    } else if (showScroll && window.pageYOffset <= 400) {
      setShowScroll(false);
    }
  };

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    window.addEventListener("scroll", checkScrollTop);
    return () => window.removeEventListener("scroll", checkScrollTop);
  }, []);

  return (
    <>
      <div className={`scroll-area`}>
        <div className="top-wrap">
          <div className="go-top-btn-wraper">
            <div className={`go-top go-top-button ${sticky && "active"}`} onClick={scrollTop}>
              <i className="fas fa-arrow-up"></i>
              <i className="fas fa-arrow-up"></i>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ScrollToTop;
