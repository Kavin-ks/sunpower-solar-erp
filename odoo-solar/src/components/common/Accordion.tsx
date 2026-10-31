

import accordion_data from '@/data/AccordionData';
import React from 'react';

const Accordion = () => {
  return (
    <>
      {/* <!-- Start Accordion --> */}
      <div className="tab_container pb-3">
        <div id="tab1" className="tab_content">
          <div className="accordion" id="accordionExample">
            {accordion_data.map((item, i) =>
              <div key={i} className="accordion-item wow animate__fadeInDown">
                <h2 className="accordion-header" id={`heading${item.id} active`}>
                  <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${item.id}`} aria-expanded={`${i === 0 ? "true" : "false"}`} aria-controls={`collapse${item.id}`}>
                    {item.question}
                  </button>
                </h2>
                <div id={`collapse${item.id}`} className={`accordion-collapse collapse ${i === 0 ? "show" : ""}`} aria-labelledby="headingOne" data-bs-parent="#accordionExample">
                  <div className="accordion-body">
                    <p>{item.answer}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* <!-- End Accordion --> */}
    </>
  );
};

export default Accordion;