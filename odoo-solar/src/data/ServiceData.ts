import service_img_1 from "@/assets/images/resource/service1.png";
import service_img_2 from "@/assets/images/resource/service2.png";
import service_img_3 from "@/assets/images/resource/service3.png";
import { StaticImageData } from "next/image";

export interface ServiceItem {
  id: number;
  path: string;
  img: StaticImageData;
  iconType: '1kw' | '2kw' | '3kw' | '4kw' | '5kw' | 'custom';
  title: string;
  capacity: string;
  badgeTag: string;
  panels: string;
  area: string;
  generation: string;
  price: string;
  subsidy: string;
  netCost: string;
  appliances: string;
  sm_des: string;
}

const service_data: ServiceItem[] = [
  // 1kW System
  {
    id: 1,
    path: "home_1",
    img: service_img_1,
    iconType: "1kw",
    title: "1 kW Solar Rooftop System",
    capacity: "1 kW",
    badgeTag: "Starter Bestseller",
    panels: "2x 550W Mono PERC Half-Cut",
    area: "~80–100 sq.ft.",
    generation: "~4–4.5 kWh / day",
    price: "₹68,000",
    subsidy: "₹30,000 Direct Subsidy",
    netCost: "₹38,000 Net",
    appliances: "Lights, Fans, TV, Refrigerator",
    sm_des: "Compact & budget-friendly system for 1–2 BHK homes. Offsets ~120 units monthly with Tier-1 550W Mono PERC modules.",
  },
  // 2kW System
  {
    id: 2,
    path: "home_1",
    img: service_img_2,
    iconType: "2kw",
    title: "2 kW Standard Home Package",
    capacity: "2 kW",
    badgeTag: "Standard Residence",
    panels: "4x 550W Mono PERC Half-Cut",
    area: "~180–200 sq.ft.",
    generation: "~8–9 kWh / day",
    price: "₹1,28,000",
    subsidy: "₹60,000 Direct Subsidy",
    netCost: "₹68,000 Net",
    appliances: "Washing Machine, Fridge, TV, Full Home",
    sm_des: "Ideal for 2–3 BHK residences. Offsets washing machine, refrigerator, and daily loads with ~250 units monthly clean generation.",
  },
  // 3kW System
  {
    id: 3,
    path: "home_1",
    img: service_img_3,
    iconType: "3kw",
    title: "3 kW Family System (Max Subsidy)",
    capacity: "3 kW",
    badgeTag: "Maximum Subsidy ★",
    panels: "6x 550W Mono PERC Half-Cut",
    area: "~260–300 sq.ft.",
    generation: "~12–14 kWh / day",
    price: "₹1,85,000",
    subsidy: "₹78,000 Maximum Subsidy",
    netCost: "₹1,07,000 Net",
    appliances: "1 Inverter AC + Full Household",
    sm_des: "Our #1 most popular package! Easily runs 1 inverter AC and full household appliances with ~380 units monthly production.",
  },

  // 4kW System
  {
    id: 4,
    path: "service",
    img: service_img_2,
    iconType: "4kw",
    title: "4 kW High-Capacity Package",
    capacity: "4 kW",
    badgeTag: "Multi-Floor Duplex",
    panels: "8x 550W Mono PERC Half-Cut",
    area: "~360–400 sq.ft.",
    generation: "~16–18 kWh / day",
    price: "₹2,35,000",
    subsidy: "₹78,000 Central Subsidy",
    netCost: "₹1,57,000 Net",
    appliances: "2 Inverter ACs + Water Pump",
    sm_des: "Engineered for duplex & multi-floor independent houses with multiple air conditioners and water pump. ~500 units monthly output.",
  },
  // 5kW System
  {
    id: 5,
    path: "service",
    img: service_img_3,
    iconType: "5kw",
    title: "5 kW Villa & Commercial Powerhouse",
    capacity: "5 kW",
    badgeTag: "Villa & Clinic Powerhouse",
    panels: "10x 550W Mono PERC Half-Cut",
    area: "~450–500 sq.ft.",
    generation: "~20–22 kWh / day",
    price: "₹2,85,000",
    subsidy: "₹78,000 Central Subsidy",
    netCost: "₹2,07,000 Net",
    appliances: "3 ACs + Commercial Loads",
    sm_des: "Dual-MPPT 3-phase / 1-phase heavy duty solar plant for luxury villas, commercial shops, and clinics. ~620 units monthly savings.",
  },
  // Custom EPC
  {
    id: 6,
    path: "service",
    img: service_img_1,
    iconType: "custom",
    title: "Custom On-Grid & Off-Grid EPC",
    capacity: "10kW–100kW+",
    badgeTag: "Commercial & Industrial EPC",
    panels: "Tier-1 High-Efficiency Modules",
    area: "Tailored Rooftop Survey",
    generation: "High Yield Commercial",
    price: "Custom Estimate",
    subsidy: "Full Net-Metering Support",
    netCost: "Fast 3-Yr Payback",
    appliances: "Factories, Colleges, Hospitals",
    sm_des: "Turnkey engineering, procurement & construction for hospitals, colleges, factories, and farms with complete DISCOM approval.",
  },
];

export default service_data;