interface DataType {
  id: number;
  title: string;
  link: string;
  has_dropdown: boolean;
  sub_menus?: {
    link: string;
    title: string;
  }[];
}

// Clean Customer-Facing Menu (All in one single straight line)
const menu_data: DataType[] = [
  {
    id: 1,
    title: "Home",
    link: "/",
    has_dropdown: false,
  },
  {
    id: 2,
    title: "About",
    link: "/about",
    has_dropdown: false,
  },
  {
    id: 3,
    title: "Services",
    link: "#",
    has_dropdown: true,
    sub_menus: [
      { link: "/service", title: "1kW–5kW Solar Packages" },
      { link: "/service-details", title: "On-Grid & Off-Grid Systems" },
    ],
  },
  {
    id: 4,
    title: "Projects",
    link: "#",
    has_dropdown: true,
    sub_menus: [
      { link: "/project-grid", title: "40 Monthly Sites" },
      { link: "/project-details", title: "Rooftop Installations" },
    ],
  },
  {
    id: 5,
    title: "Pages",
    link: "#",
    has_dropdown: true,
    sub_menus: [
      { link: "/team", title: "Our 15-Crew Technicians" },
      { link: "/faq", title: "Government Subsidy FAQ" },
      { link: "/blog", title: "Solar Clean Energy News" },
    ],
  },
  {
    id: 6,
    title: "Contact",
    link: "/contact",
    has_dropdown: false,
  },
  {
    id: 7,
    title: "Support & Warranty",
    link: "/complaint",
    has_dropdown: false,
  },
];

export default menu_data;
