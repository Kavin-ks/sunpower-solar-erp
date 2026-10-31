'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  getEnquiries,
  getOrders,
  getInventory,
  getSerialNumbers,
  getInstallations,
  getServiceTickets,
  getTechnicians,
  acceptQuotation,
} from '@/lib/api';

// Types
export interface PackageBOMItem {
  sku: string;
  name: string;
  qty: number;
  serialReq: boolean;
  warrantyYrs: number;
}

export interface SolarPackage {
  code: string;
  name: string;
  type: 'On-Grid' | 'Off-Grid';
  kw: number;
  basePrice: number;
  installFee: number;
  subsidy: number;
  costEstimate: number;
  bom: PackageBOMItem[];
}

export interface CustomerEnquiry {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  source: 'Web Form' | 'WhatsApp' | 'Phone Call';
  kw: number;
  systemType: 'On-Grid' | 'Off-Grid';
  subsidy: boolean;
  subsidyStatus: 'Pending Docs' | 'Submitted' | 'Approved' | 'Disbursed' | 'Not Applicable';
  shadowFreeSqft: number;
  monthlyBill: number;
  gridSuitable: boolean;
  surveyor: string;
  roofDirection: string;
  roofTilt: number;
  cableDistance: number;
  status: 'New Enquiry' | 'Basics Checked' | 'Survey Scheduled' | 'Survey Approved' | 'Survey Rejected' | 'Quoted' | 'Order Confirmed';
  createdAt: string;
}

export interface OrderItem {
  orderId: string;
  enquiryId: string;
  customerName: string;
  phone: string;
  address: string;
  packageCode: string;
  packageName: string;
  kw: number;
  systemType: 'On-Grid' | 'Off-Grid';
  basePrice: number;
  installFee: number;
  subsidy: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'Pending' | 'Advance Paid' | 'Fully Paid';
  warehouseStatus: 'Pending Packing' | 'Ready to Dispatch' | 'Dispatched & Installed';
  crewAssigned: string;
  scheduledDate: string;
  hardwareCost: number;
  techHours: number;
  labourCost: number;
  subsidyStatus: string;
  status: 'Draft Quote' | 'Order Confirmed' | 'In Progress' | 'Completed & Signed';
  datePeriod?: 'today' | 'week' | 'month';
}

export interface InventoryItem {
  sku: string;
  name: string;
  category: string;
  stock: number;
  unitCost: number;
  warrantyYrs: number;
  serialReq: boolean;
}

export interface SerialRegistryItem {
  serial: string;
  sku: string;
  itemName: string;
  customerName: string;
  phone: string;
  orderId: string;
  dispatchedDate: string;
  warrantyYears: number;
  warrantyExpiry: string;
  status: string;
}

export interface InstallationItem {
  orderId: string;
  customerName: string;
  address: string;
  systemSizeKw: number;
  leadTech: string;
  scheduledDate: string;
  startTime: string;
  finishTime: string;
  standsMounted: boolean;
  panelsLaid: boolean;
  boxesConnected: boolean;
  earthingFinished: boolean;
  powerTested: boolean;
  photoUploaded: boolean;
  photoUrl?: string;
  signedBy: string;
  signatureData: string;
  status: 'Scheduled' | 'In Progress on Roof' | 'Completed & Signed';
}

export interface SupportTicket {
  ticketId: string;
  customerName: string;
  phone: string;
  serial: string;
  itemName: string;
  faultCode: string;
  installedMonthsAgo: number;
  underWarranty: boolean;
  partsCost: number;
  labourCost: number;
  totalBilled: number;
  assignedTech: string;
  status: 'Open - Bill Generated' | 'Repair In Progress' | 'Customer Confirmed & Closed';
}

export interface TechnicianItem {
  id: number;
  name: string;
  role: string;
  jobsThisMonth: number;
  hoursLogged: number;
  rate: number;
  status: string;
}

const DEFAULT_PACKAGES: SolarPackage[] = [
  {
    code: 'PKG-ONG-1KW',
    name: '1 kW On-Grid Rooftop Starter',
    type: 'On-Grid',
    kw: 1,
    basePrice: 65000,
    installFee: 8000,
    subsidy: 30000,
    costEstimate: 48500,
    bom: [
      { sku: 'PNL-MONO-550W', name: 'Mono PERC 550W Solar Panel', qty: 2, serialReq: true, warrantyYrs: 20 },
      { sku: 'INV-ONG-1KW', name: 'SunPower 1kW Grid-Tie Inverter', qty: 1, serialReq: true, warrantyYrs: 2 },
      { sku: 'CHG-MPPT-40A', name: 'Battery Charge Controller', qty: 1, serialReq: true, warrantyYrs: 2 },
      { sku: 'STD-GALV-1KW', name: 'Metal Mounting Stands (1kW)', qty: 1, serialReq: false, warrantyYrs: 10 },
      { sku: 'WIR-DCAC-KIT', name: 'Wiring Boxes, Connectors & Wires', qty: 1, serialReq: false, warrantyYrs: 5 },
      { sku: 'ERT-CHEM-KIT', name: 'Safety Earthing Kit', qty: 1, serialReq: false, warrantyYrs: 5 }
    ]
  },
  {
    code: 'PKG-ONG-3KW',
    name: '3 kW On-Grid Subsidy Bestseller',
    type: 'On-Grid',
    kw: 3,
    basePrice: 172000,
    installFee: 15000,
    subsidy: 78000,
    costEstimate: 129000,
    bom: [
      { sku: 'PNL-MONO-550W', name: 'Mono PERC 550W Solar Panel', qty: 6, serialReq: true, warrantyYrs: 20 },
      { sku: 'INV-ONG-3KW', name: 'SunPower 3kW String Inverter', qty: 1, serialReq: true, warrantyYrs: 2 },
      { sku: 'CHG-MPPT-60A', name: 'Battery Charge Controller', qty: 1, serialReq: true, warrantyYrs: 2 },
      { sku: 'STD-GALV-3KW', name: 'Galvanized Metal Stands (3kW)', qty: 1, serialReq: false, warrantyYrs: 10 },
      { sku: 'WIR-DCAC-KIT', name: 'Wiring Boxes, Switches & Wires', qty: 1, serialReq: false, warrantyYrs: 5 },
      { sku: 'ERT-CHEM-KIT', name: 'Safety Earthing & Arrestor Kit', qty: 1, serialReq: false, warrantyYrs: 5 }
    ]
  },
  {
    code: 'PKG-ONG-5KW',
    name: '5 kW On-Grid Villa & Factory System',
    type: 'On-Grid',
    kw: 5,
    basePrice: 275000,
    installFee: 22000,
    subsidy: 78000,
    costEstimate: 208000,
    bom: [
      { sku: 'PNL-MONO-550W', name: 'Mono PERC 550W Solar Panel', qty: 10, serialReq: true, warrantyYrs: 20 },
      { sku: 'INV-ONG-5KW', name: 'SunPower 5kW Dual-MPPT Inverter', qty: 1, serialReq: true, warrantyYrs: 2 },
      { sku: 'CHG-MPPT-80A', name: 'Heavy Duty Charge Controller', qty: 1, serialReq: true, warrantyYrs: 2 },
      { sku: 'STD-GALV-5KW', name: 'Heavy Metal Mounting Stands (5kW)', qty: 1, serialReq: false, warrantyYrs: 10 },
      { sku: 'WIR-DCAC-KIT', name: 'Industrial Wiring Boxes & Wires', qty: 2, serialReq: false, warrantyYrs: 5 },
      { sku: 'ERT-CHEM-KIT', name: 'Dual Chemical Safety Earthing', qty: 2, serialReq: false, warrantyYrs: 5 }
    ]
  },
  {
    code: 'PKG-OFF-3KW',
    name: '3 kW Off-Grid System (With Battery Backup)',
    type: 'Off-Grid',
    kw: 3,
    basePrice: 240000,
    installFee: 18000,
    subsidy: 0,
    costEstimate: 182000,
    bom: [
      { sku: 'PNL-MONO-550W', name: 'Mono PERC 550W Solar Panel', qty: 6, serialReq: true, warrantyYrs: 20 },
      { sku: 'INV-HYB-3KW', name: 'SunPower 3kW Off-Grid Hybrid Inverter', qty: 1, serialReq: true, warrantyYrs: 2 },
      { sku: 'BAT-LFP-150AH', name: 'Large LiFePO4 48V 150Ah Battery', qty: 2, serialReq: true, warrantyYrs: 2 },
      { sku: 'CHG-MPPT-60A', name: 'Smart MPPT Charge Controller', qty: 1, serialReq: true, warrantyYrs: 2 },
      { sku: 'STD-GALV-3KW', name: 'Galvanized Metal Stands & Battery Rack', qty: 1, serialReq: false, warrantyYrs: 10 },
      { sku: 'WIR-DCAC-KIT', name: 'DC/AC Wiring Boxes, Switches & Wires', qty: 1, serialReq: false, warrantyYrs: 5 },
      { sku: 'ERT-CHEM-KIT', name: 'Safety Earthing Kit', qty: 1, serialReq: false, warrantyYrs: 5 }
    ]
  },
  {
    code: 'PKG-OFF-5KW',
    name: '5 kW Off-Grid Factory Backup System',
    type: 'Off-Grid',
    kw: 5,
    basePrice: 385000,
    installFee: 25000,
    subsidy: 0,
    costEstimate: 295000,
    bom: [
      { sku: 'PNL-MONO-550W', name: 'Mono PERC 550W Solar Panel', qty: 10, serialReq: true, warrantyYrs: 20 },
      { sku: 'INV-HYB-5KW', name: 'SunPower 5kW Off-Grid Inverter', qty: 1, serialReq: true, warrantyYrs: 2 },
      { sku: 'BAT-LFP-150AH', name: 'Large LiFePO4 48V 150Ah Battery', qty: 4, serialReq: true, warrantyYrs: 2 },
      { sku: 'CHG-MPPT-80A', name: 'Smart MPPT Charge Controller', qty: 1, serialReq: true, warrantyYrs: 2 },
      { sku: 'STD-GALV-5KW', name: 'Heavy Duty Metal Stands', qty: 1, serialReq: false, warrantyYrs: 10 },
      { sku: 'WIR-DCAC-KIT', name: 'Wiring Boxes, Connectors & Cables', qty: 2, serialReq: false, warrantyYrs: 5 },
      { sku: 'ERT-CHEM-KIT', name: 'Safety Earthing Kit', qty: 2, serialReq: false, warrantyYrs: 5 }
    ]
  }
];

const DEFAULT_ENQUIRIES: CustomerEnquiry[] = [
  {
    id: 'ENQ-2610-101',
    customerName: 'Ramesh Venkataraman',
    email: 'ramesh.v@gmail.com',
    phone: '9840123456',
    address: 'Plot 42, 2nd Main Road, Anna Nagar, Chennai',
    source: 'Web Form',
    kw: 3,
    systemType: 'On-Grid',
    subsidy: true,
    subsidyStatus: 'Approved',
    shadowFreeSqft: 340,
    monthlyBill: 4800,
    gridSuitable: true,
    surveyor: 'Karthik Subramanian',
    roofDirection: 'South',
    roofTilt: 13,
    cableDistance: 18,
    status: 'Order Confirmed',
    createdAt: '2026-10-24'
  },
  {
    id: 'ENQ-2610-102',
    customerName: 'Lakshmi Narayanan (Apex Small Prints)',
    email: 'lakshmi@apexprints.in',
    phone: '9840987654',
    address: 'SIDCO Industrial Estate, Ambattur, Chennai',
    source: 'WhatsApp',
    kw: 5,
    systemType: 'Off-Grid',
    subsidy: false,
    subsidyStatus: 'Not Applicable',
    shadowFreeSqft: 620,
    monthlyBill: 11500,
    gridSuitable: true,
    surveyor: 'Karthik Subramanian',
    roofDirection: 'South-East',
    roofTilt: 12,
    cableDistance: 25,
    status: 'Survey Approved',
    createdAt: '2026-10-27'
  },
  {
    id: 'ENQ-2610-103',
    customerName: 'Aravind Swamy',
    email: 'aravind.home@yahoo.com',
    phone: '9444112233',
    address: '14, Seaward Road, Valmiki Nagar, Thiruvanmiyur',
    source: 'Phone Call',
    kw: 3,
    systemType: 'On-Grid',
    subsidy: true,
    subsidyStatus: 'Pending Docs',
    shadowFreeSqft: 0,
    monthlyBill: 4100,
    gridSuitable: false,
    surveyor: 'Unassigned',
    roofDirection: 'South',
    roofTilt: 13,
    cableDistance: 15,
    status: 'New Enquiry',
    createdAt: '2026-10-30'
  }
];

const DEFAULT_ORDERS: OrderItem[] = [
  {
    orderId: 'ORD-2610-501',
    enquiryId: 'ENQ-2610-101',
    customerName: 'Ramesh Venkataraman',
    phone: '9840123456',
    address: 'Plot 42, 2nd Main Road, Anna Nagar, Chennai',
    packageCode: 'PKG-ONG-3KW',
    packageName: '3 kW On-Grid Subsidy Bestseller',
    kw: 3,
    systemType: 'On-Grid',
    basePrice: 172000,
    installFee: 15000,
    subsidy: 78000,
    totalAmount: 187000,
    paidAmount: 95000,
    paymentStatus: 'Advance Paid',
    warehouseStatus: 'Ready to Dispatch',
    crewAssigned: 'Senthil Kumar (Crew Alpha - 3 Techs)',
    scheduledDate: '2026-10-31',
    hardwareCost: 129000,
    techHours: 14,
    labourCost: 5600,
    subsidyStatus: 'Submitted to TANGEDCO',
    status: 'Order Confirmed',
    datePeriod: 'today'
  },
  {
    orderId: 'ORD-2504-312',
    enquiryId: 'ENQ-2504-019',
    customerName: 'Meenakshi Sundaram',
    phone: '9841055667',
    address: '88, Gandhi Road, Velachery, Chennai',
    packageCode: 'PKG-OFF-3KW',
    packageName: '3 kW Off-Grid System (With Battery Backup)',
    kw: 3,
    systemType: 'Off-Grid',
    basePrice: 240000,
    installFee: 18000,
    subsidy: 0,
    totalAmount: 258000,
    paidAmount: 258000,
    paymentStatus: 'Fully Paid',
    warehouseStatus: 'Dispatched & Installed',
    crewAssigned: 'Prakash Raj (Crew Beta - 3 Techs)',
    scheduledDate: '2025-04-28',
    hardwareCost: 182000,
    techHours: 18,
    labourCost: 6300,
    subsidyStatus: 'Not Applicable',
    status: 'Completed & Signed',
    datePeriod: 'month'
  },
  {
    orderId: 'ORD-2308-104',
    enquiryId: 'ENQ-2308-004',
    customerName: 'SureshBabu Textiles',
    phone: '9444099887',
    address: '45, GST Road, Chromepet, Chennai',
    packageCode: 'PKG-ONG-5KW',
    packageName: '5 kW On-Grid Villa & Factory System',
    kw: 5,
    systemType: 'On-Grid',
    basePrice: 275000,
    installFee: 22000,
    subsidy: 78000,
    totalAmount: 297000,
    paidAmount: 297000,
    paymentStatus: 'Fully Paid',
    warehouseStatus: 'Dispatched & Installed',
    crewAssigned: 'Dinesh Babu (Crew Gamma - 4 Techs)',
    scheduledDate: '2023-08-15',
    hardwareCost: 268000,
    techHours: 52,
    labourCost: 34000,
    subsidyStatus: 'Disbursed',
    status: 'Completed & Signed',
    datePeriod: 'month'
  }
];

const DEFAULT_INVENTORY: InventoryItem[] = [
  { sku: 'PNL-MONO-550W', name: 'Mono PERC 550W Half-Cut Solar Panel', category: 'Solar Panel', stock: 142, unitCost: 11500, warrantyYrs: 20, serialReq: true },
  { sku: 'INV-ONG-3KW', name: 'SunPower 3kW String Grid-Tie Inverter', category: 'Inverter', stock: 14, unitCost: 24000, warrantyYrs: 2, serialReq: true },
  { sku: 'INV-ONG-5KW', name: 'SunPower 5kW Dual-MPPT Grid Inverter', category: 'Inverter', stock: 9, unitCost: 36000, warrantyYrs: 2, serialReq: true },
  { sku: 'INV-HYB-3KW', name: 'SunPower 3kW Hybrid Off-Grid Inverter', category: 'Inverter', stock: 8, unitCost: 34000, warrantyYrs: 2, serialReq: true },
  { sku: 'BAT-LFP-150AH', name: 'LiFePO4 48V 150Ah Solar Battery Bank', category: 'Battery', stock: 16, unitCost: 42000, warrantyYrs: 2, serialReq: true },
  { sku: 'CHG-MPPT-60A', name: 'Smart MPPT 60A Charge Controller', category: 'Charge Controller', stock: 24, unitCost: 6500, warrantyYrs: 2, serialReq: true },
  { sku: 'STD-GALV-3KW', name: 'Hot-Dip Galvanized Metal Stands', category: 'Mounting Stand', stock: 28, unitCost: 8500, warrantyYrs: 10, serialReq: false },
  { sku: 'WIR-DCAC-KIT', name: 'ACDB/DCDB Wiring Boxes & Connectors', category: 'Wiring & Boxes', stock: 45, unitCost: 6200, warrantyYrs: 5, serialReq: false },
  { sku: 'ERT-CHEM-KIT', name: 'Safety Earthing & Arrestor Kit', category: 'Safety Earthing', stock: 38, unitCost: 4800, warrantyYrs: 5, serialReq: false }
];

const DEFAULT_SERIALS: SerialRegistryItem[] = [
  {
    serial: 'INV-3KW-2025-8841',
    sku: 'INV-HYB-3KW',
    itemName: 'SunPower 3kW Hybrid Off-Grid Inverter',
    customerName: 'Meenakshi Sundaram',
    phone: '9841055667',
    orderId: 'ORD-2504-312',
    dispatchedDate: '2025-04-28',
    warrantyYears: 2,
    warrantyExpiry: '2027-04-28',
    status: 'Installed (18 Months Ago - Rainy Season Scene)'
  },
  {
    serial: 'BAT-LFP-2025-9910',
    sku: 'BAT-LFP-150AH',
    itemName: 'LiFePO4 48V 150Ah Solar Battery Bank',
    customerName: 'Meenakshi Sundaram',
    phone: '9841055667',
    orderId: 'ORD-2504-312',
    dispatchedDate: '2025-04-28',
    warrantyYears: 2,
    warrantyExpiry: '2027-04-28',
    status: 'Installed'
  },
  {
    serial: 'PNL-550W-2025-4401',
    sku: 'PNL-MONO-550W',
    itemName: 'Mono PERC 550W Half-Cut Solar Panel',
    customerName: 'Meenakshi Sundaram',
    phone: '9841055667',
    orderId: 'ORD-2504-312',
    dispatchedDate: '2025-04-28',
    warrantyYears: 20,
    warrantyExpiry: '2045-04-28',
    status: 'Installed (20-Year Active Warranty)'
  },
  {
    serial: 'INV-5KW-2023-1109',
    sku: 'INV-ONG-5KW',
    itemName: 'SunPower 5kW Dual-MPPT Grid Inverter',
    customerName: 'SureshBabu Textiles',
    phone: '9444099887',
    orderId: 'ORD-2308-104',
    dispatchedDate: '2023-08-15',
    warrantyYears: 2,
    warrantyExpiry: '2025-08-15',
    status: 'Installed (Warranty Expired)'
  }
];

const DEFAULT_INSTALLATIONS: InstallationItem[] = [
  {
    orderId: 'ORD-2610-501',
    customerName: 'Ramesh Venkataraman',
    address: 'Plot 42, 2nd Main Road, Anna Nagar, Chennai',
    systemSizeKw: 3,
    leadTech: 'Senthil Kumar (Crew Alpha)',
    scheduledDate: '2026-10-31',
    startTime: '09:15',
    finishTime: '16:30',
    standsMounted: true,
    panelsLaid: true,
    boxesConnected: true,
    earthingFinished: true,
    powerTested: false,
    photoUploaded: false,
    signedBy: '',
    signatureData: '',
    status: 'In Progress on Roof'
  }
];

const DEFAULT_TICKETS: SupportTicket[] = [
  {
    ticketId: 'TKT-2610-901',
    customerName: 'Meenakshi Sundaram',
    phone: '9841055667',
    serial: 'INV-3KW-2025-8841',
    itemName: 'SunPower 3kW Hybrid Off-Grid Inverter',
    faultCode: 'ERR-GRID-OV04 (Zero Power in Heavy Rain)',
    installedMonthsAgo: 18,
    underWarranty: true,
    partsCost: 0,
    labourCost: 0,
    totalBilled: 0,
    assignedTech: 'Senthil Kumar',
    status: 'Repair In Progress'
  },
  {
    ticketId: 'TKT-2610-902',
    customerName: 'SureshBabu Textiles',
    phone: '9444099887',
    serial: 'INV-5KW-2023-1109',
    itemName: 'SunPower 5kW Dual-MPPT Grid Inverter',
    faultCode: 'ERR-IGBT-12 (DC Relay Burnout)',
    installedMonthsAgo: 38,
    underWarranty: false,
    partsCost: 4200,
    labourCost: 1500,
    totalBilled: 5700,
    assignedTech: 'Prakash Raj',
    status: 'Open - Bill Generated'
  }
];

const DEFAULT_TECHNICIANS: TechnicianItem[] = [
  { id: 1, name: 'Senthil Kumar', role: 'Lead Crew Alpha (3 Techs)', jobsThisMonth: 9, hoursLogged: 142, rate: 400, status: 'On Site (Anna Nagar)' },
  { id: 2, name: 'Prakash Raj', role: 'Lead Crew Beta (3 Techs)', jobsThisMonth: 8, hoursLogged: 128, rate: 350, status: 'Service Call (Chromepet)' },
  { id: 3, name: 'Dinesh Babu', role: 'Lead Crew Gamma (4 Techs)', jobsThisMonth: 8, hoursLogged: 134, rate: 350, status: 'On Site (Tambaram)' },
  { id: 4, name: 'Karthik Subramanian', role: 'Senior Roof Surveyor', jobsThisMonth: 15, hoursLogged: 118, rate: 350, status: 'Surveying (Ambattur)' },
  { id: 5, name: 'Arunachalam M (+4 Riggers)', role: 'Field Riggers & Electricians', jobsThisMonth: 12, hoursLogged: 420, rate: 280, status: 'Active Across Sites' }
];

export const formatINR = (val: number) => {
  return '₹' + Number(val || 0).toLocaleString('en-IN');
};

const SunPowerERP = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'enquiry' | 'quote' | 'dispatch' | 'roof' | 'warranty' | 'director'>('overview');

  // Persistence
  const [enquiries, setEnquiries] = useState<CustomerEnquiry[]>(DEFAULT_ENQUIRIES);
  const [orders, setOrders] = useState<OrderItem[]>(DEFAULT_ORDERS);
  const [inventory, setInventory] = useState<InventoryItem[]>(DEFAULT_INVENTORY);
  const [serials, setSerials] = useState<SerialRegistryItem[]>(DEFAULT_SERIALS);
  const [installations, setInstallations] = useState<InstallationItem[]>(DEFAULT_INSTALLATIONS);
  const [tickets, setTickets] = useState<SupportTicket[]>(DEFAULT_TICKETS);
  const [technicians, setTechnicians] = useState<TechnicianItem[]>(DEFAULT_TECHNICIANS);
  const [directorPeriod, setDirectorPeriod] = useState<'today' | 'week' | 'month'>('month');

  // Scene 1: Form state
  const [newEnqName, setNewEnqName] = useState('');
  const [newEnqEmail, setNewEnqEmail] = useState('');
  const [newEnqPhone, setNewEnqPhone] = useState('');
  const [newEnqAddress, setNewEnqAddress] = useState('');
  const [newEnqKw, setNewEnqKw] = useState<number>(3);
  const [newEnqType, setNewEnqType] = useState<'On-Grid' | 'Off-Grid'>('On-Grid');
  const [newEnqSource, setNewEnqSource] = useState<'Web Form' | 'WhatsApp' | 'Phone Call'>('Web Form');
  const [newEnqSubsidy, setNewEnqSubsidy] = useState(true);
  const [enqErrors, setEnqErrors] = useState<{ [key: string]: string }>({});

  // Active Enquiry for Surveying / Quote gatekeeper
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string>(DEFAULT_ENQUIRIES[0].id);

  // Scene 3: Barcode scanning simulation
  const [scannedSerial, setScannedSerial] = useState('');
  const [scanMessage, setScanMessage] = useState('');

  // Scene 4: HTML5 Canvas E-Signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [roofPhotoUploaded, setRoofPhotoUploaded] = useState(false);

  // Scene 5: Sub-second warranty lookup query
  const [searchQuery, setSearchQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<SerialRegistryItem | null>(null);

  // Notification Toast
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const notify = (text: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load / Save localStorage & Hydrate from Live Spring Boot Backend
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sunpower_erp_state_next_v1');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.enquiries) setEnquiries(parsed.enquiries);
          if (parsed.orders) setOrders(parsed.orders);
          if (parsed.inventory) setInventory(parsed.inventory);
          if (parsed.serials) setSerials(parsed.serials);
          if (parsed.installations) setInstallations(parsed.installations);
          if (parsed.tickets) setTickets(parsed.tickets);
          if (parsed.technicians) setTechnicians(parsed.technicians);
        } catch (e) {
          console.error('Failed to parse saved state', e);
        }
      }
    }

    // Live sync from Spring Boot backend (port 8080)
    const hydrateFromBackend = async () => {
      try {
        const [liveEnqs, liveTechs, liveSerials] = await Promise.allSettled([
          getEnquiries(),
          getTechnicians(),
          getSerialNumbers(),
        ]);

        if (liveEnqs.status === 'fulfilled' && Array.isArray(liveEnqs.value) && liveEnqs.value.length > 0) {
          const mappedEnqs: CustomerEnquiry[] = liveEnqs.value.map((e: any) => ({
            id: e.enquiryNumber || `ENQ-${e.id}`,
            customerName: e.customer?.fullName || 'Customer',
            email: e.customer?.email || 'customer@sunpower.com',
            phone: e.customer?.phone || '9876543210',
            address: e.customer?.address || 'Chennai, Tamil Nadu',
            source: e.source === 'WEBSITE' ? 'Web Form' : e.source === 'WHATSAPP' ? 'WhatsApp' : 'Phone Call',
            kw: Number(e.requestedCapacityKw) || 3,
            systemType: e.systemType === 'OFF_GRID' ? 'Off-Grid' : 'On-Grid',
            subsidy: !!e.subsidyRequired,
            subsidyStatus: e.subsidyRequired ? 'Pending Docs' : 'Not Applicable',
            shadowFreeSqft: Number(e.shadowFreeAreaSqFt) || 0,
            monthlyBill: Number(e.monthlyElectricityBill) || 0,
            gridSuitable: e.gridSuitable !== false,
            surveyor: e.assignedTo?.fullName || 'Unassigned',
            roofDirection: 'South',
            roofTilt: 13,
            cableDistance: 15,
            status: e.status === 'CONVERTED' ? 'Order Confirmed' : e.status === 'QUOTED' ? 'Quoted' : e.status === 'SURVEY_APPROVED' ? 'Survey Approved' : 'New Enquiry',
            createdAt: e.createdAt ? String(e.createdAt).split('T')[0] : new Date().toISOString().split('T')[0]
          }));
          setEnquiries(prev => {
            const liveIds = new Set(mappedEnqs.map(m => m.id));
            return [...mappedEnqs, ...prev.filter(p => !liveIds.has(p.id))];
          });
        }

        if (liveTechs.status === 'fulfilled' && Array.isArray(liveTechs.value) && liveTechs.value.length > 0) {
          const mappedTechs: TechnicianItem[] = liveTechs.value.map((t: any) => ({
            id: t.id,
            name: t.name,
            role: t.skills || 'Rooftop Installer',
            jobsThisMonth: 8,
            hoursLogged: 36,
            rate: Number(t.hourlyRate) || 250,
            status: t.available ? 'Available' : 'On Roof'
          }));
          setTechnicians(mappedTechs);
        }

        if (liveSerials.status === 'fulfilled' && Array.isArray(liveSerials.value) && liveSerials.value.length > 0) {
          const mappedSerials: SerialRegistryItem[] = liveSerials.value.map((s: any) => ({
            serial: s.serialCode,
            sku: s.product?.productCode || 'PROD',
            itemName: s.product?.name || 'Solar Component',
            customerName: s.customer?.fullName || 'Main Warehouse',
            phone: s.customer?.phone || '9876543210',
            orderId: s.salesOrder?.orderNumber || 'STOCK',
            dispatchedDate: s.dispatchDate || new Date().toISOString().split('T')[0],
            warrantyYears: s.product?.defaultWarrantyMonths ? Math.round(s.product.defaultWarrantyMonths / 12) : 2,
            warrantyExpiry: new Date(Date.now() + 63072000000).toISOString().split('T')[0],
            status: s.status === 'INSTALLED' ? 'Installed (Active Warranty)' : 'In Stock'
          }));
          setSerials(prev => {
            const liveCodes = new Set(mappedSerials.map(m => m.serial));
            return [...mappedSerials, ...prev.filter(p => !liveCodes.has(p.serial))];
          });
        }
      } catch (err) {
        console.warn('Backend live sync notice (fallback mode active):', err);
      }
    };

    hydrateFromBackend();
  }, []);

  const saveAll = (
    newEnqs = enquiries,
    newOrds = orders,
    newInv = inventory,
    newSers = serials,
    newInsts = installations,
    newTks = tickets,
    newTechs = technicians
  ) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'sunpower_erp_state_next_v1',
        JSON.stringify({
          enquiries: newEnqs,
          orders: newOrds,
          inventory: newInv,
          serials: newSers,
          installations: newInsts,
          tickets: newTks,
          technicians: newTechs
        })
      );
    }
  };

  // Reset to default
  const handleResetData = () => {
    setEnquiries(DEFAULT_ENQUIRIES);
    setOrders(DEFAULT_ORDERS);
    setInventory(DEFAULT_INVENTORY);
    setSerials(DEFAULT_SERIALS);
    setInstallations(DEFAULT_INSTALLATIONS);
    setTickets(DEFAULT_TICKETS);
    setTechnicians(DEFAULT_TECHNICIANS);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sunpower_erp_state_next_v1');
    }
    notify('Reset demo dataset to fresh SunPower Solutions records!', 'success');
  };

  // SCENE 1: INQUIRY SUBMIT WITH STRICT VALIDATION
  const handleCreateEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!newEnqName.trim() || newEnqName.trim().length < 3) {
      errors.name = 'Full name must be at least 3 characters.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEnqEmail.trim())) {
      errors.email = 'Valid email address required (e.g., name@domain.com).';
    }
    const cleanPhone = newEnqPhone.replace(/[^0-9]/g, '');
    if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) {
      errors.phone = 'Valid 10-digit Indian mobile number required (starting with 6-9).';
    }
    if (!newEnqAddress.trim() || newEnqAddress.trim().length < 8) {
      errors.address = 'Detailed rooftop installation address required (at least 8 characters).';
    }

    if (Object.keys(errors).length > 0) {
      setEnqErrors(errors);
      notify('Validation Failed: Please fix the highlighted errors.', 'error');
      return;
    }

    setEnqErrors({});
    const newId = `ENQ-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;

    const newEnq: CustomerEnquiry = {
      id: newId,
      customerName: newEnqName.trim(),
      email: newEnqEmail.trim(),
      phone: cleanPhone,
      address: newEnqAddress.trim(),
      source: newEnqSource,
      kw: Number(newEnqKw),
      systemType: newEnqType,
      subsidy: newEnqSubsidy,
      subsidyStatus: newEnqSubsidy ? 'Pending Docs' : 'Not Applicable',
      shadowFreeSqft: 0,
      monthlyBill: 0,
      gridSuitable: false,
      surveyor: 'Unassigned',
      roofDirection: 'South',
      roofTilt: 13,
      cableDistance: 15,
      status: 'New Enquiry',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newEnq, ...enquiries];
    setEnquiries(updated);
    saveAll(updated);
    setSelectedEnquiryId(newId);

    // Reset fields
    setNewEnqName('');
    setNewEnqEmail('');
    setNewEnqPhone('');
    setNewEnqAddress('');

    // Sync to Spring Boot MySQL database in real time
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    fetch(`${apiUrl}/api/enquiries/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: newEnqName.trim(),
        phone: cleanPhone,
        email: newEnqEmail.trim(),
        address: newEnqAddress.trim(),
        city: 'Chennai',
        pincode: '600001',
        requestedCapacityKw: Number(newEnqKw),
        systemType: newEnqType === 'Off-Grid' ? 'OFF_GRID' : 'ON_GRID',
        subsidyRequired: newEnqSubsidy,
        notes: `Created via SunPowerERP UI. Source: ${newEnqSource}`
      })
    }).catch(e => console.warn('Background sync to Spring Boot notice:', e));

    notify(`Enquiry ${newId} logged into CRM! Will never vanish. Proceed to Screening Call & Roof Survey.`, 'success');
  };

  // SCENE 1: SCREENING & ROOF SURVEY
  const currentEnquiry = enquiries.find(e => e.id === selectedEnquiryId) || enquiries[0];

  const updateCurrentEnquiry = (updates: Partial<CustomerEnquiry>) => {
    if (!currentEnquiry) return;
    const updated = enquiries.map(e => (e.id === currentEnquiry.id ? { ...e, ...updates } : e));
    setEnquiries(updated);
    saveAll(updated);
  };

  const approveSurvey = () => {
    if (!currentEnquiry) return;
    if (currentEnquiry.shadowFreeSqft < 100) {
      notify('Survey cannot be approved: Shadow-free roof area must be at least 100 sq.ft.', 'warning');
      return;
    }
    if (!currentEnquiry.gridSuitable && currentEnquiry.systemType === 'On-Grid') {
      notify('Survey warning: On-Grid connection suitability must be confirmed.', 'warning');
      return;
    }
    updateCurrentEnquiry({
      status: 'Survey Approved',
      surveyor: 'Karthik Subramanian (Certified Surveyor)'
    });
    notify(`Survey Approved for ${currentEnquiry.customerName}! Quote Gatekeeper unlocked.`, 'success');
  };

  const rejectSurvey = () => {
    if (!currentEnquiry) return;
    updateCurrentEnquiry({ status: 'Survey Rejected' });
    notify(`Survey marked as Rejected for ${currentEnquiry.customerName}.`, 'error');
  };

  // SCENE 2: GENERATE QUOTE FROM READY TEMPLATE & TRIGGER PAYMENT
  const selectedPackage = DEFAULT_PACKAGES.find(p => p.kw === currentEnquiry?.kw && p.type === currentEnquiry?.systemType) || DEFAULT_PACKAGES[1];
  const [quotationAccepted, setQuotationAccepted] = useState<boolean>(false);
  const [acceptingQuote, setAcceptingQuote] = useState<boolean>(false);

  const handleAcceptQuotation = async () => {
    if (!currentEnquiry) return;
    setAcceptingQuote(true);
    try {
      const numId = parseInt(currentEnquiry.id.replace(/\D/g, '')) || 1;
      try {
        await acceptQuotation(numId);
      } catch (apiErr) {
        console.log('Customer portal API call status:', apiErr);
      }
      setQuotationAccepted(true);
      updateCurrentEnquiry({
        status: 'Quoted',
      });
      notify(`Quotation for ${currentEnquiry.customerName} marked ACCEPTED by Customer! Advance payment unlocked.`, 'success');
    } catch (err: any) {
      notify(err?.message || 'Failed to accept quotation', 'error');
    } finally {
      setAcceptingQuote(false);
    }
  };

  const handleConfirmQuoteAndAdvance = (payType: 'advance' | 'full') => {
    if (!currentEnquiry) return;
    if (currentEnquiry.status !== 'Survey Approved' && currentEnquiry.status !== 'Quoted' && !quotationAccepted) {
      notify('STRICT GATEKEEPER RULE: Quotes are locked until roof survey is approved!', 'error');
      return;
    }

    const total = selectedPackage.basePrice + selectedPackage.installFee;
    const paid = payType === 'advance' ? Math.round(total * 0.5) : total;
    const newOrderId = `ORD-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(500 + Math.random() * 499)}`;

    const newOrder: OrderItem = {
      orderId: newOrderId,
      enquiryId: currentEnquiry.id,
      customerName: currentEnquiry.customerName,
      phone: currentEnquiry.phone,
      address: currentEnquiry.address,
      packageCode: selectedPackage.code,
      packageName: selectedPackage.name,
      kw: selectedPackage.kw,
      systemType: selectedPackage.type,
      basePrice: selectedPackage.basePrice,
      installFee: selectedPackage.installFee,
      subsidy: selectedPackage.subsidy,
      totalAmount: total,
      paidAmount: paid,
      paymentStatus: payType === 'advance' ? 'Advance Paid' : 'Fully Paid',
      warehouseStatus: 'Ready to Dispatch',
      crewAssigned: 'Senthil Kumar (Crew Alpha - 3 Technicians)',
      scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      hardwareCost: selectedPackage.costEstimate,
      techHours: 14,
      labourCost: 5600,
      subsidyStatus: currentEnquiry.subsidy ? 'Submitted to TANGEDCO' : 'Not Applicable',
      status: 'Order Confirmed',
      datePeriod: 'today'
    };

    const newInstallation: InstallationItem = {
      orderId: newOrderId,
      customerName: currentEnquiry.customerName,
      address: currentEnquiry.address,
      systemSizeKw: selectedPackage.kw,
      leadTech: 'Senthil Kumar (Crew Alpha)',
      scheduledDate: newOrder.scheduledDate,
      startTime: '09:00',
      finishTime: '16:00',
      standsMounted: false,
      panelsLaid: false,
      boxesConnected: false,
      earthingFinished: false,
      powerTested: false,
      photoUploaded: false,
      signedBy: '',
      signatureData: '',
      status: 'Scheduled'
    };

    const updatedOrders = [newOrder, ...orders];
    const updatedInsts = [newInstallation, ...installations];
    const updatedEnqs = enquiries.map(e => (e.id === currentEnquiry.id ? { ...e, status: 'Order Confirmed' as const } : e));

    setOrders(updatedOrders);
    setInstallations(updatedInsts);
    setEnquiries(updatedEnqs);
    saveAll(updatedEnqs, updatedOrders, inventory, serials, updatedInsts, tickets, technicians);

    notify(`Payment of ${formatINR(paid)} received! Auto-synced to Warehouse packing alert & Crew schedule!`, 'success');
  };

  // SCENE 3: BARCODE SCAN & WARRANTY CLOCK
  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedSerial.trim()) {
      setScanMessage('⚠️ Please enter or scan a valid alphanumeric serial barcode.');
      return;
    }

    const clean = scannedSerial.trim().toUpperCase();
    const existing = serials.find(s => s.serial.toUpperCase() === clean);

    if (existing) {
      setScanMessage(`✅ Serial [${existing.serial}] validated! Linked to ${existing.customerName} (Order: ${existing.orderId}). Warranty clock ACTIVE.`);
      notify(`Serial verified: ${existing.itemName} (Expires: ${existing.warrantyExpiry})`, 'success');
      return;
    }

    // Auto-create serial if unknown for demo dispatch
    const isPanel = clean.startsWith('PNL');
    const warrantyYrs = isPanel ? 20 : 2;
    const now = new Date();
    const expiry = new Date(now.setFullYear(now.getFullYear() + warrantyYrs)).toISOString().split('T')[0];

    const newRegistry: SerialRegistryItem = {
      serial: clean,
      sku: isPanel ? 'PNL-MONO-550W' : 'INV-ONG-3KW',
      itemName: isPanel ? 'Mono PERC 550W Half-Cut Solar Panel' : 'SunPower 3kW String Inverter',
      customerName: 'Ramesh Venkataraman',
      phone: '9840123456',
      orderId: 'ORD-2610-501',
      dispatchedDate: new Date().toISOString().split('T')[0],
      warrantyYears: warrantyYrs,
      warrantyExpiry: expiry,
      status: `Dispatched & Clock Started (${warrantyYrs} Years)`
    };

    const updatedSerials = [newRegistry, ...serials];
    setSerials(updatedSerials);
    saveAll(enquiries, orders, inventory, updatedSerials, installations, tickets, technicians);

    setScanMessage(`🚀 Serial [${clean}] scanned! Delivery confirmed. ${warrantyYrs}-Year Warranty Clock started automatically!`);
    notify(`Warranty clock started automatically: ${warrantyYrs} Years for ${clean}!`, 'success');
    setScannedSerial('');
  };

  // SCENE 4: CANVAS SIGNATURE DRAWING
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#19142d';
  }, [activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const completeHandover = (instOrderId: string) => {
    const canvas = canvasRef.current;
    const sigData = canvas ? canvas.toDataURL() : '';

    const target = installations.find(i => i.orderId === instOrderId);
    if (!target) return;

    if (!target.standsMounted || !target.panelsLaid || !target.boxesConnected || !target.earthingFinished || !target.powerTested) {
      notify('Cannot complete handover: All 5 roof checklist items (including Live Power Generation Test) must be verified!', 'warning');
      return;
    }

    const updatedInsts = installations.map(inst =>
      inst.orderId === instOrderId
        ? {
            ...inst,
            photoUploaded: true,
            photoUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&q=80',
            signedBy: target.customerName,
            signatureData: sigData,
            status: 'Completed & Signed' as const
          }
        : inst
    );

    const updatedOrders = orders.map(ord => (ord.orderId === instOrderId ? { ...ord, status: 'Completed & Signed' as const } : ord));

    setInstallations(updatedInsts);
    setOrders(updatedOrders);
    saveAll(enquiries, updatedOrders, inventory, serials, updatedInsts, tickets, technicians);

    notify(`Installation & Handover completed! Customer e-signature & roof photos securely captured.`, 'success');
  };

  // SCENE 5: SUB-SECOND WARRANTY LOOKUP
  const handleWarrantySearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setLookupResult(null);
      return;
    }
    const clean = query.trim().toLowerCase();
    const match = serials.find(
      s =>
        s.serial.toLowerCase().includes(clean) ||
        s.customerName.toLowerCase().includes(clean) ||
        s.phone.includes(clean)
    );
    setLookupResult(match || null);
  };

  const simulateRainySeasonBreakdown = () => {
    // Quick load the 18-month scenario from PDF
    setSearchQuery('INV-3KW-2025-8841');
    handleWarrantySearch('INV-3KW-2025-8841');
    notify('Loaded Scene 5 Scenario: Meenakshi Sundaram - 18 months into 2-year warranty during heavy rain!', 'success');
  };

  const createSupportTicketForMatch = () => {
    if (!lookupResult) return;
    const now = new Date();
    const expiryDate = new Date(lookupResult.warrantyExpiry);
    const isUnderWarranty = now < expiryDate;

    const parts = isUnderWarranty ? 0 : 4200;
    const labour = isUnderWarranty ? 0 : 1500;
    const total = parts + labour;

    const newTicket: SupportTicket = {
      ticketId: `TKT-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(800 + Math.random() * 199)}`,
      customerName: lookupResult.customerName,
      phone: lookupResult.phone,
      serial: lookupResult.serial,
      itemName: lookupResult.itemName,
      faultCode: 'ERR-GRID-OV04 (Inverter Zero Power / Rain Fault)',
      installedMonthsAgo: 18,
      underWarranty: isUnderWarranty,
      partsCost: parts,
      labourCost: labour,
      totalBilled: total,
      assignedTech: 'Senthil Kumar (Crew Alpha)',
      status: isUnderWarranty ? 'Repair In Progress' : 'Open - Bill Generated'
    };

    const updated = [newTicket, ...tickets];
    setTickets(updated);
    saveAll(enquiries, orders, inventory, serials, installations, updated, technicians);

    notify(
      isUnderWarranty
        ? `Customer is UNDER WARRANTY! Auto-billed ₹0 for parts & labor. Ticket ${newTicket.ticketId} assigned!`
        : `Warranty EXPIRED! Parts (₹4,200) + Labour (₹1,500) = ₹5,700 automatically billed!`,
      isUnderWarranty ? 'success' : 'warning'
    );
  };

  // SCENE 6: DIRECTOR'S MONTH-END ANALYTICS & CSV EXPORT
  const filteredOrders = orders.filter(o => {
    if (directorPeriod === 'today') return o.datePeriod === 'today';
    if (directorPeriod === 'week') return o.datePeriod === 'today' || o.datePeriod === 'week';
    return true;
  });

  const totalRevenue = filteredOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalHardwareCost = filteredOrders.reduce((acc, o) => acc + o.hardwareCost, 0);
  const totalLabourCost = filteredOrders.reduce((acc, o) => acc + o.labourCost, 0);
  const totalNetProfit = totalRevenue - totalHardwareCost - totalLabourCost;
  const overallMargin = totalRevenue > 0 ? ((totalNetProfit / totalRevenue) * 100).toFixed(1) : '0';

  const exportDirectorCSV = () => {
    let csv = 'Order ID,Customer Name,System kW,Type,Invoice Revenue (INR),Hardware Stock Cost (INR),Tech Labour Cost (INR),Net Profit (INR),Margin %,Subsidy Status,Status\n';
    orders.forEach(o => {
      const profit = o.totalAmount - o.hardwareCost - o.labourCost;
      const margin = ((profit / o.totalAmount) * 100).toFixed(1);
      csv += `"${o.orderId}","${o.customerName}","${o.kw} kW","${o.systemType}",${o.totalAmount},${o.hardwareCost},${o.labourCost},${profit},"${margin}%","${o.subsidyStatus}","${o.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SunPower_Director_MonthEnd_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Downloaded SunPower Solutions Executive Director P&L CSV Report!', 'success');
  };

  return (
    <div className="sunpower-erp-wrapper py-4" style={{ background: '#f8fafc', minHeight: '100vh', color: '#1e293b' }}>
      <div className="container-fluid px-lg-5">
        
        {/* TOP ALERT NOTIFICATION */}
        {notification && (
          <div
            className={`alert alert-${notification.type === 'success' ? 'success' : notification.type === 'warning' ? 'warning' : 'danger'} alert-dismissible fade show shadow-sm`}
            role="alert"
            style={{ position: 'fixed', top: '90px', right: '30px', zIndex: 9999, minWidth: '320px' }}
          >
            <strong>{notification.type === 'success' ? '✅ Success' : notification.type === 'warning' ? '⚠️ Note' : '❌ Error'}:</strong> {notification.text}
            <button type="button" className="btn-close" onClick={() => setNotification(null)}></button>
          </div>
        )}

        {/* HERO TITLE & SCALE METRICS BAR */}
        <div className="row mb-4">
          <div className="col-12">
            <div
              className="p-4 rounded-4 text-white shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-3"
              style={{ background: 'linear-gradient(135deg, #19142d 0%, #291f4a 100%)', borderLeft: '6px solid #ff5e14' }}
            >
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="badge" style={{ background: '#e63a27', fontSize: '13px' }}>Odoo Solar System ERP</span>
                  <span className="text-warning small font-monospace">Enterprise Solar Management</span>
                </div>
                <h2 className="text-white fw-bold m-0" style={{ letterSpacing: '-0.5px' }}>
                  Solar Installation Management & Inventory Backbone
                </h2>
                <p className="text-white-50 m-0 mt-1 small">
                  Unified operations from First Rooftop Lead to 20-Year Auto-Warranty Clock, Mobile Crew E-Signatures, and Director Job P&L.
                </p>
              </div>

              {/* Company Metrics Badges from PDF */}
              <div className="d-flex flex-wrap gap-2">
                <div className="px-3 py-2 rounded-3 text-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="text-warning fw-bold fs-5">~40 / mo</div>
                  <div className="small text-white-50" style={{ fontSize: '11px' }}>Rooftop Scale</div>
                </div>
                <div className="px-3 py-2 rounded-3 text-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="text-success fw-bold fs-5">15 Crew</div>
                  <div className="small text-white-50" style={{ fontSize: '11px' }}>Active Technicians</div>
                </div>
                <div className="px-3 py-2 rounded-3 text-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="text-info fw-bold fs-5">1kW - 5kW</div>
                  <div className="small text-white-50" style={{ fontSize: '11px' }}>On & Off-Grid</div>
                </div>
                <button onClick={handleResetData} className="btn btn-outline-light btn-sm align-self-center ms-2" title="Reset Demo Data">
                  <i className="bi bi-arrow-counterclockwise"></i> Reset Demo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 6 OPERATIONAL WORKFLOW TABS (Matching the 6 scenes of the PDF) */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="nav nav-pills nav-fill bg-white p-2 rounded-4 shadow-sm border gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`nav-link text-start py-2 px-3 rounded-3 ${activeTab === 'overview' ? 'active' : ''}`}
                style={{ backgroundColor: activeTab === 'overview' ? '#19142d' : 'transparent', color: activeTab === 'overview' ? '#fff' : '#475569' }}
              >
                <div className="fw-bold fs-6">🏠 ERP Dashboard</div>
                <div className="small opacity-75" style={{ fontSize: '11px' }}>Operations Overview</div>
              </button>

              <button
                onClick={() => setActiveTab('enquiry')}
                className={`nav-link text-start py-2 px-3 rounded-3 ${activeTab === 'enquiry' ? 'active' : ''}`}
                style={{ backgroundColor: activeTab === 'enquiry' ? '#19142d' : 'transparent', color: activeTab === 'enquiry' ? '#fff' : '#475569' }}
              >
                <div className="fw-bold fs-6">1️⃣ The Rooftop Inquiry</div>
                <div className="small opacity-75" style={{ fontSize: '11px' }}>Omnichannel & Gatekeeper</div>
              </button>

              <button
                onClick={() => setActiveTab('quote')}
                className={`nav-link text-start py-2 px-3 rounded-3 ${activeTab === 'quote' ? 'active' : ''}`}
                style={{ backgroundColor: activeTab === 'quote' ? '#19142d' : 'transparent', color: activeTab === 'quote' ? '#fff' : '#475569' }}
              >
                <div className="fw-bold fs-6">2️⃣ Getting the Kit Right</div>
                <div className="small opacity-75" style={{ fontSize: '11px' }}>Auto-BOM & Crew Sync</div>
              </button>

              <button
                onClick={() => setActiveTab('dispatch')}
                className={`nav-link text-start py-2 px-3 rounded-3 ${activeTab === 'dispatch' ? 'active' : ''}`}
                style={{ backgroundColor: activeTab === 'dispatch' ? '#19142d' : 'transparent', color: activeTab === 'dispatch' ? '#fff' : '#475569' }}
              >
                <div className="fw-bold fs-6">3️⃣ Dispatch & Serials</div>
                <div className="small opacity-75" style={{ fontSize: '11px' }}>Barcode & 20-Yr Clocks</div>
              </button>

              <button
                onClick={() => setActiveTab('roof')}
                className={`nav-link text-start py-2 px-3 rounded-3 ${activeTab === 'roof' ? 'active' : ''}`}
                style={{ backgroundColor: activeTab === 'roof' ? '#19142d' : 'transparent', color: activeTab === 'roof' ? '#fff' : '#475569' }}
              >
                <div className="fw-bold fs-6">4️⃣ On the Roof</div>
                <div className="small opacity-75" style={{ fontSize: '11px' }}>Mobile Handover & E-Sign</div>
              </button>

              <button
                onClick={() => setActiveTab('warranty')}
                className={`nav-link text-start py-2 px-3 rounded-3 ${activeTab === 'warranty' ? 'active' : ''}`}
                style={{ backgroundColor: activeTab === 'warranty' ? '#19142d' : 'transparent', color: activeTab === 'warranty' ? '#fff' : '#475569' }}
              >
                <div className="fw-bold fs-6">5️⃣ Rainy Breakdown</div>
                <div className="small opacity-75" style={{ fontSize: '11px' }}>Sub-Second Auto-Warranty</div>
              </button>

              <button
                onClick={() => setActiveTab('director')}
                className={`nav-link text-start py-2 px-3 rounded-3 ${activeTab === 'director' ? 'active' : ''}`}
                style={{ backgroundColor: activeTab === 'director' ? '#19142d' : 'transparent', color: activeTab === 'director' ? '#fff' : '#475569' }}
              >
                <div className="fw-bold fs-6">6️⃣ Director's Month-End</div>
                <div className="small opacity-75" style={{ fontSize: '11px' }}>P&L Margins & Subsidy</div>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 0: OVERVIEW DASHBOARD */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="row g-4">
            <div className="col-lg-3 col-md-6">
              <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted small text-uppercase fw-semibold">Monthly Scale</span>
                  <span className="badge bg-primary-subtle text-primary p-2 rounded-circle"><i className="bi bi-graph-up-arrow"></i></span>
                </div>
                <h3 className="fw-bold m-0 text-dark">38 <span className="fs-6 text-muted fw-normal">/ 40 target</span></h3>
                <div className="progress mt-3" style={{ height: '6px' }}>
                  <div className="progress-bar bg-success" role="progressbar" style={{ width: '95%' }}></div>
                </div>
                <p className="text-muted small mt-2 m-0">95% of monthly target completed</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted small text-uppercase fw-semibold">Active Field Force</span>
                  <span className="badge bg-success-subtle text-success p-2 rounded-circle"><i className="bi bi-people-fill"></i></span>
                </div>
                <h3 className="fw-bold m-0 text-dark">15 Technicians</h3>
                <p className="text-success small fw-semibold mt-3 m-0"><i className="bi bi-check-circle-fill"></i> 4 Crews active across Chennai</p>
                <p className="text-muted small m-0">Auto-synchronized with orders</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted small text-uppercase fw-semibold">High-Value Stock</span>
                  <span className="badge bg-warning-subtle text-warning p-2 rounded-circle"><i className="bi bi-box-seam-fill"></i></span>
                </div>
                <h3 className="fw-bold m-0 text-dark">{formatINR(3485000)}</h3>
                <p className="text-muted small mt-3 m-0">142 Panels | 31 Inverters | 16 Batteries</p>
                <p className="text-muted small m-0">Serialized Barcode Dispatch</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted small text-uppercase fw-semibold">Govt. Subsidy Disbursed</span>
                  <span className="badge bg-info-subtle text-info p-2 rounded-circle"><i className="bi bi-shield-check"></i></span>
                </div>
                <h3 className="fw-bold m-0 text-dark">{formatINR(1482000)}</h3>
                <p className="text-info small fw-semibold mt-3 m-0">PM Surya Ghar Yojana</p>
                <p className="text-muted small m-0">19 Homeowners subsidized</p>
              </div>
            </div>

            {/* Quick Scene Jump Cards */}
            <div className="col-12 mt-2">
              <h5 className="fw-bold mb-3">Operational Problem Statement Walkthrough</h5>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white hover-shadow">
                <div className="badge bg-dark mb-2 align-self-start">Scene 1</div>
                <h5 className="fw-bold">The Rooftop Inquiry</h5>
                <p className="text-muted small">
                  Enquiries arrive via WhatsApp, Web form, and Calls. Strict input validation prevents lost leads. Survey Gatekeeper locks quotes until shadow-free space and tilt are approved.
                </p>
                <button onClick={() => setActiveTab('enquiry')} className="btn btn-sm btn-outline-dark mt-auto">
                  Launch Scene 1 <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white hover-shadow">
                <div className="badge bg-dark mb-2 align-self-start">Scene 2</div>
                <h5 className="fw-bold">Getting the Kit Right</h5>
                <p className="text-muted small">
                  Ready-made 1kW to 5kW On-Grid and Off-Grid templates with automatic Bill of Materials (BOM). Confirming payment automatically syncs to warehouse packing and 15-tech crew schedule.
                </p>
                <button onClick={() => setActiveTab('quote')} className="btn btn-sm btn-outline-dark mt-auto">
                  Launch Scene 2 <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white hover-shadow">
                <div className="badge bg-dark mb-2 align-self-start">Scene 3</div>
                <h5 className="fw-bold">Dispatch Day & Serials</h5>
                <p className="text-muted small">
                  ₹1,50,000+ trucks dispatch with serialized barcode scanning. The delivery automatically starts the 2-Year Inverter/Battery and 20-Year Solar Panel warranty clocks.
                </p>
                <button onClick={() => setActiveTab('dispatch')} className="btn btn-sm btn-outline-dark mt-auto">
                  Launch Scene 3 <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white hover-shadow">
                <div className="badge bg-dark mb-2 align-self-start">Scene 4</div>
                <h5 className="fw-bold">On the Roof Handover</h5>
                <p className="text-muted small">
                  Mobile crew tablet form: Records start/finish times, 5 checklist roof steps, power test verification, roof photo upload, and HTML5 canvas homeowner signature.
                </p>
                <button onClick={() => setActiveTab('roof')} className="btn btn-sm btn-outline-dark mt-auto">
                  Launch Scene 4 <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white hover-shadow">
                <div className="badge bg-dark mb-2 align-self-start">Scene 5</div>
                <h5 className="fw-bold">The Rainy Season Breakdown</h5>
                <p className="text-muted small">
                  18 months later, customer calls with zero power! Sub-second lookup finds inverter serial: Under warranty = ₹0 free billing; Expired = Auto-billed Parts + Labour ticket.
                </p>
                <button onClick={() => setActiveTab('warranty')} className="btn btn-sm btn-outline-dark mt-auto">
                  Launch Scene 5 <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white hover-shadow">
                <div className="badge bg-dark mb-2 align-self-start">Scene 6</div>
                <h5 className="fw-bold">Director's Month-End P&L</h5>
                <p className="text-muted small">
                  Calculates exact Net Profit/Loss per installation (Revenue minus Stock Cost and Technician Hours). Tracks subsidies, 15-technician payroll, and one-click CSV report export.
                </p>
                <button onClick={() => setActiveTab('director')} className="btn btn-sm btn-outline-dark mt-auto">
                  Launch Scene 6 <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCENE 1: THE ROOFTOP INQUIRY & SURVEY GATEKEEPER */}
        {/* ========================================================================= */}
        {activeTab === 'enquiry' && (
          <div className="row g-4">
            {/* Left Column: Form to log new enquiry (Web / WhatsApp / Call) */}
            <div className="col-lg-5">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                  <h5 className="fw-bold m-0">📥 Omnichannel Lead Intake</h5>
                  <span className="badge bg-success">Enquiry Never Vanishes</span>
                </div>
                <p className="text-muted small mb-3">
                  Log customer enquiries arriving via Web Form, WhatsApp, or Phone. Strict validation prevents missing details.
                </p>

                <form onSubmit={handleCreateEnquiry}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Customer Full Name *</label>
                    <input
                      type="text"
                      className={`form-control form-control-sm ${enqErrors.name ? 'is-invalid' : ''}`}
                      placeholder="e.g. Ramesh Venkataraman"
                      value={newEnqName}
                      onChange={e => setNewEnqName(e.target.value)}
                    />
                    {enqErrors.name && <div className="invalid-feedback">{enqErrors.name}</div>}
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Email Address *</label>
                      <input
                        type="email"
                        className={`form-control form-control-sm ${enqErrors.email ? 'is-invalid' : ''}`}
                        placeholder="name@domain.com"
                        value={newEnqEmail}
                        onChange={e => setNewEnqEmail(e.target.value)}
                      />
                      {enqErrors.email && <div className="invalid-feedback">{enqErrors.email}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">10-Digit Phone *</label>
                      <input
                        type="tel"
                        className={`form-control form-control-sm ${enqErrors.phone ? 'is-invalid' : ''}`}
                        placeholder="e.g. 9840123456"
                        value={newEnqPhone}
                        onChange={e => setNewEnqPhone(e.target.value)}
                      />
                      {enqErrors.phone && <div className="invalid-feedback">{enqErrors.phone}</div>}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Installation Address *</label>
                    <textarea
                      rows={2}
                      className={`form-control form-control-sm ${enqErrors.address ? 'is-invalid' : ''}`}
                      placeholder="Street, Area, City (e.g. Anna Nagar, Chennai)"
                      value={newEnqAddress}
                      onChange={e => setNewEnqAddress(e.target.value)}
                    ></textarea>
                    {enqErrors.address && <div className="invalid-feedback">{enqErrors.address}</div>}
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Capacity (kW) *</label>
                      <select className="form-select form-select-sm" value={newEnqKw} onChange={e => setNewEnqKw(Number(e.target.value))}>
                        <option value={1}>1 kW</option>
                        <option value={2}>2 kW</option>
                        <option value={3}>3 kW (Subsidy)</option>
                        <option value={4}>4 kW</option>
                        <option value={5}>5 kW</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">System Type *</label>
                      <select className="form-select form-select-sm" value={newEnqType} onChange={e => setNewEnqType(e.target.value as any)}>
                        <option value="On-Grid">On-Grid</option>
                        <option value="Off-Grid">Off-Grid (Battery)</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Channel Source *</label>
                      <select className="form-select form-select-sm" value={newEnqSource} onChange={e => setNewEnqSource(e.target.value as any)}>
                        <option value="Web Form">Web Form</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Phone Call">Phone Call</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="subsidyCheck"
                      checked={newEnqSubsidy}
                      onChange={e => setNewEnqSubsidy(e.target.checked)}
                    />
                    <label className="form-check-label small" htmlFor="subsidyCheck">
                      Apply under Government Subsidy (PM Surya Ghar Yojana)
                    </label>
                  </div>

                  <button type="submit" className="btn btn-dark w-100 fw-bold" style={{ background: '#19142d' }}>
                    <i className="bi bi-plus-circle me-1"></i> Register Enquiry Into CRM
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: CRM Inquiries List & Roof Survey Gatekeeper */}
            <div className="col-lg-7">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold m-0">📋 Active CRM Inquiries ({enquiries.length})</h5>
                  <span className="small text-muted">Select an enquiry to perform survey</span>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle small">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Type & kW</th>
                        <th>Source</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enquiries.map(enq => (
                        <tr key={enq.id} className={enq.id === selectedEnquiryId ? 'table-warning' : ''}>
                          <td className="fw-bold font-monospace">{enq.id}</td>
                          <td>
                            <div className="fw-semibold">{enq.customerName}</div>
                            <div className="text-muted" style={{ fontSize: '11px' }}>{enq.phone}</div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border me-1">{enq.kw} kW</span>
                            <span className="badge bg-secondary">{enq.systemType}</span>
                          </td>
                          <td>
                            <span className="badge bg-info-subtle text-info">{enq.source}</span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                enq.status === 'Survey Approved'
                                  ? 'bg-success'
                                  : enq.status === 'Survey Rejected'
                                  ? 'bg-danger'
                                  : enq.status === 'Order Confirmed'
                                  ? 'bg-primary'
                                  : 'bg-warning text-dark'
                              }`}
                            >
                              {enq.status}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => setSelectedEnquiryId(enq.id)}
                              className="btn btn-outline-dark btn-sm py-0 px-2"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* INSPECTED ENQUIRY: SCREENING & SURVEY GATEKEEPER */}
              {currentEnquiry && (
                <div className="card border-0 rounded-4 shadow-sm p-4 bg-white" style={{ borderTop: '4px solid #ff5e14' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <span className="badge bg-secondary mb-1">Gatekeeper Inspection</span>
                      <h5 className="fw-bold m-0">{currentEnquiry.customerName} ({currentEnquiry.id})</h5>
                    </div>
                    <div>
                      <span className="small text-muted">Current Gatekeeper Status: </span>
                      <span className={`badge ${currentEnquiry.status === 'Survey Approved' ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {currentEnquiry.status}
                      </span>
                    </div>
                  </div>

                  {/* Step 1: Call Phone Screening */}
                  <div className="p-3 rounded-3 bg-light mb-3">
                    <h6 className="fw-bold text-dark mb-2">Step 1: Phone Screening ("Check the Basics")</h6>
                    <div className="row g-2">
                      <div className="col-md-4">
                        <label className="form-label small">Shadow-free roof space (sq.ft)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={currentEnquiry.shadowFreeSqft}
                          onChange={e => updateCurrentEnquiry({ shadowFreeSqft: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small">Monthly Electricity Bill (₹)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={currentEnquiry.monthlyBill}
                          onChange={e => updateCurrentEnquiry({ monthlyBill: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-md-4 d-flex align-items-center pt-3">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="gridSuitCheck"
                            checked={currentEnquiry.gridSuitable}
                            onChange={e => updateCurrentEnquiry({ gridSuitable: e.target.checked })}
                          />
                          <label className="form-check-label small" htmlFor="gridSuitCheck">
                            Grid connection suitable
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Technician Roof Survey Visit */}
                  <div className="p-3 rounded-3 bg-light mb-3">
                    <h6 className="fw-bold text-dark mb-2">Step 2: Technician Roof Survey Visit</h6>
                    <div className="row g-2">
                      <div className="col-md-4">
                        <label className="form-label small">Roof Direction</label>
                        <select
                          className="form-select form-select-sm"
                          value={currentEnquiry.roofDirection}
                          onChange={e => updateCurrentEnquiry({ roofDirection: e.target.value })}
                        >
                          <option value="South">South (Optimal)</option>
                          <option value="South-East">South-East</option>
                          <option value="South-West">South-West</option>
                          <option value="East">East</option>
                          <option value="West">West</option>
                          <option value="Flat">Flat RCC Terrace</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small">Roof Tilt Angle (°)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={currentEnquiry.roofTilt}
                          onChange={e => updateCurrentEnquiry({ roofTilt: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small">Cable Distance (meters)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={currentEnquiry.cableDistance}
                          onChange={e => updateCurrentEnquiry({ cableDistance: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* GATEKEEPER DECISION BUTTONS */}
                  <div className="d-flex gap-2">
                    <button onClick={approveSurvey} className="btn btn-success btn-sm fw-bold">
                      <i className="bi bi-check-circle me-1"></i> Approve Roof Survey (Unlock Quote)
                    </button>
                    <button onClick={rejectSurvey} className="btn btn-outline-danger btn-sm">
                      <i className="bi bi-x-circle me-1"></i> Reject Survey
                    </button>
                    {currentEnquiry.status === 'Survey Approved' && (
                      <button onClick={() => setActiveTab('quote')} className="btn btn-primary btn-sm ms-auto fw-bold">
                        Proceed to Scene 2: Quotes & BOM <i className="bi bi-arrow-right"></i>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCENE 2: GETTING THE KIT RIGHT (AUTO-BOM & CREW SYNC) */}
        {/* ========================================================================= */}
        {activeTab === 'quote' && (
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <h5 className="fw-bold m-0">📦 Ready-Made Package Templates</h5>
                  <span className="badge bg-secondary">1 kW to 5 kW</span>
                </div>
                <p className="text-muted small">
                  Quotes come from standardized templates. All components are generated automatically via <strong>Auto-BOM</strong> so nobody misses small parts.
                </p>

                <div className="list-group mb-3">
                  {DEFAULT_PACKAGES.map(pkg => (
                    <div
                      key={pkg.code}
                      className={`list-group-item list-group-item-action p-3 rounded-3 mb-2 border ${
                        pkg.kw === currentEnquiry?.kw && pkg.type === currentEnquiry?.systemType ? 'border-primary bg-primary-subtle' : ''
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="fw-bold m-0">{pkg.name}</h6>
                        <span className="badge bg-dark">{pkg.type}</span>
                      </div>
                      <div className="d-flex justify-content-between text-muted small mt-2">
                        <span>Base Price: {formatINR(pkg.basePrice)}</span>
                        <span>Install Fee: {formatINR(pkg.installFee)}</span>
                        <span className="text-success fw-bold">Subsidy: {formatINR(pkg.subsidy)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* SURVEY GATEKEEPER BANNER */}
                {currentEnquiry && currentEnquiry.status !== 'Survey Approved' && currentEnquiry.status !== 'Order Confirmed' ? (
                  <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
                    <i className="bi bi-lock-fill fs-4"></i>
                    <div>
                      <strong>STRICT GATEKEEPER LOCK ACTIVE:</strong> Customer <em>{currentEnquiry.customerName}</em> survey is not yet approved. Return to Scene 1 to complete and approve survey before quoting!
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-success d-flex align-items-center gap-2" role="alert">
                    <i className="bi bi-unlock-fill fs-4"></i>
                    <div>
                      <strong>GATEKEEPER UNLOCKED:</strong> Survey approved for <em>{currentEnquiry?.customerName}</em>. Ready for automated advance/full payment confirmation.
                    </div>
                  </div>
                )}

                {/* CUSTOMER QUOTATION ACCEPTANCE UI */}
                <div className="card bg-light border p-3 rounded-3 mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <span className="small text-muted d-block">Proposal Reference</span>
                      <strong className="text-dark">QT-2026-00{currentEnquiry?.id || '1'}</strong>
                    </div>
                    <span className={`badge ${currentEnquiry?.status === 'Order Confirmed' ? 'bg-success' : (quotationAccepted || currentEnquiry?.status === 'Quoted' ? 'bg-primary' : 'bg-warning text-dark')}`}>
                      {currentEnquiry?.status === 'Order Confirmed' ? 'CONVERTED TO ORDER' : (quotationAccepted || currentEnquiry?.status === 'Quoted' ? 'QUOTE ACCEPTED' : 'PENDING CUSTOMER ACCEPTANCE')}
                    </span>
                  </div>

                  {currentEnquiry?.status === 'Order Confirmed' ? (
                    <div className="small text-success fw-bold d-flex align-items-center gap-1">
                      <i className="bi bi-check-circle-fill"></i> Order Confirmed & Zero-Touch Dispatch Triggered
                    </div>
                  ) : (quotationAccepted || currentEnquiry?.status === 'Quoted') ? (
                    <div className="small text-primary fw-semibold d-flex align-items-center gap-1">
                      <i className="bi bi-patch-check-fill"></i> Quotation Accepted by Customer. Ready for Advance Payment.
                    </div>
                  ) : (
                    <button
                      disabled={currentEnquiry?.status !== 'Survey Approved' || acceptingQuote}
                      onClick={handleAcceptQuotation}
                      className="btn btn-outline-success fw-bold w-100 py-2 d-flex align-items-center justify-center gap-2"
                    >
                      <i className="bi bi-hand-thumbs-up-fill"></i>
                      <span>{acceptingQuote ? 'Accepting Quotation...' : 'Customer: Accept Quotation & BOM'}</span>
                    </button>
                  )}
                </div>

                {/* ADVANCE PAYMENT ACTIONS */}
                <div className="d-flex gap-2 mt-auto">
                  <button
                    disabled={(currentEnquiry?.status !== 'Survey Approved' && currentEnquiry?.status !== 'Quoted' && !quotationAccepted) || currentEnquiry?.status === 'Order Confirmed'}
                    onClick={() => handleConfirmQuoteAndAdvance('advance')}
                    className="btn btn-warning flex-fill fw-bold py-2"
                  >
                    <i className="bi bi-cash-coin me-1"></i> Pay 50% Advance ({formatINR(Math.round((selectedPackage.basePrice + selectedPackage.installFee) * 0.5))})
                  </button>
                  <button
                    disabled={(currentEnquiry?.status !== 'Survey Approved' && currentEnquiry?.status !== 'Quoted' && !quotationAccepted) || currentEnquiry?.status === 'Order Confirmed'}
                    onClick={() => handleConfirmQuoteAndAdvance('full')}
                    className="btn btn-success flex-fill fw-bold py-2"
                  >
                    <i className="bi bi-check2-circle me-1"></i> Pay Full Amount ({formatINR(selectedPackage.basePrice + selectedPackage.installFee)})
                  </button>
                </div>
                <div className="small text-muted mt-2 text-center" style={{ fontSize: '11px' }}>
                  ⚡ Confirming payment automatically triggers warehouse picking alert and places job on the 15-technician crew schedule!
                </div>
              </div>
            </div>

            {/* Right Column: Auto-BOM (Bill of Materials) Detail */}
            <div className="col-lg-6">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <h5 className="fw-bold m-0">🛠️ Auto-Generated BOM ({selectedPackage.name})</h5>
                  <span className="badge bg-primary">Auto-Calculated</span>
                </div>
                <p className="text-muted small">
                  The exact list of parts follows on its own: panels, inverter, battery (if off-grid), charge controller, metal stands, switches, wires, and earthing.
                </p>

                <div className="table-responsive">
                  <table className="table table-sm table-bordered align-middle small">
                    <thead className="table-light">
                      <tr>
                        <th>SKU</th>
                        <th>Component Description</th>
                        <th>Qty</th>
                        <th>Warranty</th>
                        <th>Tracking</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPackage.bom.map((item, idx) => (
                        <tr key={idx}>
                          <td className="font-monospace text-muted">{item.sku}</td>
                          <td className="fw-semibold">{item.name}</td>
                          <td className="fw-bold">{item.qty}</td>
                          <td>
                            <span className={`badge ${item.warrantyYrs === 20 ? 'bg-success' : 'bg-info text-dark'}`}>
                              {item.warrantyYrs} Years
                            </span>
                          </td>
                          <td>
                            {item.serialReq ? (
                              <span className="badge bg-warning text-dark"><i className="bi bi-upc-scan"></i> Serial Barcode</span>
                            ) : (
                              <span className="text-muted small">Standard Stock</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 rounded-3 bg-light mt-3">
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Base Equipment Price:</span>
                    <span className="fw-bold">{formatINR(selectedPackage.basePrice)}</span>
                  </div>
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Installation & Testing Service Fee:</span>
                    <span className="fw-bold">{formatINR(selectedPackage.installFee)}</span>
                  </div>
                  <div className="d-flex justify-content-between small mb-1 text-success">
                    <span>Government Subsidy Incentive (Direct to Customer):</span>
                    <span className="fw-bold">-{formatINR(selectedPackage.subsidy)}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between fw-bold text-dark fs-6">
                    <span>Total Net Rooftop Investment:</span>
                    <span className="text-primary">{formatINR(selectedPackage.basePrice + selectedPackage.installFee - selectedPackage.subsidy)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCENE 3: DISPATCH DAY & SERIAL NUMBERS (BARCODE & WARRANTY CLOCKS) */}
        {/* ========================================================================= */}
        {activeTab === 'dispatch' && (
          <div className="row g-4">
            <div className="col-lg-5">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <h5 className="fw-bold m-0">🚚 Warehouse Dispatch Scanner</h5>
                  <span className="badge bg-warning text-dark">₹1,50,000+ Truck Check</span>
                </div>
                <p className="text-muted small">
                  The truck is about to leave with ₹1,50,000 worth of equipment. Every inverter, battery, and controller has its own serial number and must be scanned before departure.
                </p>

                <form onSubmit={handleBarcodeScan} className="mb-3">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Scan / Enter Serial Barcode</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><i className="bi bi-upc-scan"></i></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. INV-3KW-2026-9042 or PNL-550W-2026-1011"
                        value={scannedSerial}
                        onChange={e => setScannedSerial(e.target.value)}
                      />
                      <button type="submit" className="btn btn-dark" style={{ background: '#19142d' }}>
                        Scan & Dispatch
                      </button>
                    </div>
                  </div>
                </form>

                {scanMessage && (
                  <div className="alert alert-info py-2 small" role="alert">
                    {scanMessage}
                  </div>
                )}

                <div className="p-3 rounded-3 bg-light border">
                  <h6 className="fw-bold small mb-2">⚡ Automatic Warranty Clock Rule:</h6>
                  <ul className="small text-muted mb-0 ps-3">
                    <li><strong>Inverters / Batteries / Controllers:</strong> 2-Year Auto-Warranty clock starts the moment delivery is done.</li>
                    <li><strong>Solar Panels:</strong> 20-Year Auto-Warranty clock starts the moment delivery is done.</li>
                    <li><em>Zero manual date typing in registers!</em></li>
                  </ul>
                </div>

                <div className="mt-3">
                  <h6 className="fw-bold small mb-2">Quick Barcode Simulator:</h6>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      onClick={() => setScannedSerial('INV-3KW-2025-8841')}
                      className="btn btn-outline-secondary btn-sm"
                    >
                      INV-3KW-2025-8841 (Rainy Inverter)
                    </button>
                    <button
                      onClick={() => setScannedSerial('BAT-LFP-2025-9910')}
                      className="btn btn-outline-secondary btn-sm"
                    >
                      BAT-LFP-2025-9910 (Battery)
                    </button>
                    <button
                      onClick={() => setScannedSerial('PNL-550W-2025-4401')}
                      className="btn btn-outline-secondary btn-sm"
                    >
                      PNL-550W-2025-4401 (20-Yr Panel)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Active Serial Registry & Live Warranty Clocks */}
            <div className="col-lg-7">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <h5 className="fw-bold m-0">⏱️ Active Serial Registry & 20-Yr Warranty Clocks</h5>
                  <span className="badge bg-success">{serials.length} Units Tracked</span>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle small">
                    <thead className="table-light">
                      <tr>
                        <th>Serial Barcode</th>
                        <th>Component</th>
                        <th>Customer</th>
                        <th>Dispatched</th>
                        <th>Warranty Expiry</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serials.map((s, idx) => {
                        const isPanel = s.warrantyYears === 20;
                        const isExpired = new Date() > new Date(s.warrantyExpiry);
                        return (
                          <tr key={idx}>
                            <td className="fw-bold font-monospace text-primary">{s.serial}</td>
                            <td>
                              <div className="fw-semibold">{s.itemName}</div>
                              <div className="text-muted" style={{ fontSize: '11px' }}>Order: {s.orderId}</div>
                            </td>
                            <td>{s.customerName}</td>
                            <td>{s.dispatchedDate}</td>
                            <td>
                              <span className={`badge ${isExpired ? 'bg-danger' : isPanel ? 'bg-success' : 'bg-info text-dark'}`}>
                                {s.warrantyExpiry} ({s.warrantyYears} Yrs)
                              </span>
                            </td>
                            <td>
                              <span className="small text-muted">{s.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCENE 4: ON THE ROOF (MOBILE HANDOVER FORM & CANVAS SIGNATURE) */}
        {/* ========================================================================= */}
        {activeTab === 'roof' && (
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <h5 className="fw-bold m-0">📱 Mobile/Tablet Handover Form</h5>
                  <span className="badge bg-primary">Crew Alpha Assigned</span>
                </div>
                <p className="text-muted small">
                  Crew completes mounting, earthing, and live power generation testing, then captures roof photos and the homeowner screen signature.
                </p>

                {installations.map(inst => (
                  <div key={inst.orderId} className="p-3 rounded-4 border mb-3 bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <span className="badge bg-dark me-2">{inst.orderId}</span>
                        <span className="fw-bold">{inst.customerName}</span>
                      </div>
                      <span className={`badge ${inst.status === 'Completed & Signed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {inst.status}
                      </span>
                    </div>

                    <div className="small text-muted mb-3">
                      📍 {inst.address} | System: <strong>{inst.systemSizeKw} kW</strong> | Crew: <strong>{inst.leadTech}</strong>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Start Time</label>
                        <input
                          type="time"
                          className="form-control form-control-sm"
                          value={inst.startTime}
                          onChange={e => {
                            const updated = installations.map(i => (i.orderId === inst.orderId ? { ...i, startTime: e.target.value } : i));
                            setInstallations(updated);
                          }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Finish Time</label>
                        <input
                          type="time"
                          className="form-control form-control-sm"
                          value={inst.finishTime}
                          onChange={e => {
                            const updated = installations.map(i => (i.orderId === inst.orderId ? { ...i, finishTime: e.target.value } : i));
                            setInstallations(updated);
                          }}
                        />
                      </div>
                    </div>

                    {/* The 5 Roof Verification Steps from PDF */}
                    <h6 className="fw-bold small text-dark mb-2">The 5 Mandatory Roof Steps:</h6>
                    <div className="d-flex flex-column gap-1 mb-3">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`step1-${inst.orderId}`}
                          checked={inst.standsMounted}
                          onChange={e => {
                            const updated = installations.map(i => (i.orderId === inst.orderId ? { ...i, standsMounted: e.target.checked } : i));
                            setInstallations(updated);
                          }}
                        />
                        <label className="form-check-label small" htmlFor={`step1-${inst.orderId}`}>
                          1. Metal Mounting Stands securely mounted & anchored
                        </label>
                      </div>

                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`step2-${inst.orderId}`}
                          checked={inst.panelsLaid}
                          onChange={e => {
                            const updated = installations.map(i => (i.orderId === inst.orderId ? { ...i, panelsLaid: e.target.checked } : i));
                            setInstallations(updated);
                          }}
                        />
                        <label className="form-check-label small" htmlFor={`step2-${inst.orderId}`}>
                          2. Solar Panels laid, aligned & mid/end-clamped
                        </label>
                      </div>

                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`step3-${inst.orderId}`}
                          checked={inst.boxesConnected}
                          onChange={e => {
                            const updated = installations.map(i => (i.orderId === inst.orderId ? { ...i, boxesConnected: e.target.checked } : i));
                            setInstallations(updated);
                          }}
                        />
                        <label className="form-check-label small" htmlFor={`step3-${inst.orderId}`}>
                          3. ACDB / DCDB wiring boxes & switches connected
                        </label>
                      </div>

                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`step4-${inst.orderId}`}
                          checked={inst.earthingFinished}
                          onChange={e => {
                            const updated = installations.map(i => (i.orderId === inst.orderId ? { ...i, earthingFinished: e.target.checked } : i));
                            setInstallations(updated);
                          }}
                        />
                        <label className="form-check-label small" htmlFor={`step4-${inst.orderId}`}>
                          4. Safety earthing & lightning arrestor finished
                        </label>
                      </div>

                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`step5-${inst.orderId}`}
                          checked={inst.powerTested}
                          onChange={e => {
                            const updated = installations.map(i => (i.orderId === inst.orderId ? { ...i, powerTested: e.target.checked } : i));
                            setInstallations(updated);
                          }}
                        />
                        <label className="form-check-label small fw-bold text-success" htmlFor={`step5-${inst.orderId}`}>
                          5. Live Power Generation Test Verified (kW feed tested)
                        </label>
                      </div>
                    </div>

                    {/* Roof Photo Upload Simulation */}
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Roof Photos Upload</label>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRoofPhotoUploaded(true);
                            notify('Rooftop solar installation photo uploaded & verified!', 'success');
                          }}
                          className="btn btn-outline-dark btn-sm"
                        >
                          <i className="bi bi-camera me-1"></i> Simulate Camera Photo Upload
                        </button>
                        {roofPhotoUploaded && <span className="text-success small fw-semibold">✅ 3 Photos Attached</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => completeHandover(inst.orderId)}
                      disabled={inst.status === 'Completed & Signed'}
                      className="btn btn-success w-100 fw-bold"
                    >
                      {inst.status === 'Completed & Signed' ? '✅ Handover Completed & Signed' : 'Sign & Complete Handover'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: HTML5 Canvas E-Signature Pad */}
            <div className="col-lg-5">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <h5 className="fw-bold m-0">✍️ Homeowner Screen Signature</h5>
                  <button onClick={clearSignature} className="btn btn-outline-secondary btn-sm py-0 px-2">
                    Clear Pad
                  </button>
                </div>
                <p className="text-muted small">
                  The homeowner signs on the screen to accept the completed work. The company has clear proof, and the customer has zero doubt.
                </p>

                <div className="border rounded-3 p-2 bg-light mb-3 text-center">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={180}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                    style={{ background: '#ffffff', borderRadius: '8px', cursor: 'crosshair', maxWidth: '100%', touchAction: 'none' }}
                  ></canvas>
                  <div className="small text-muted mt-1" style={{ fontSize: '11px' }}>
                    Sign above using finger, stylus, or mouse
                  </div>
                </div>

                <div className="p-3 rounded-3 bg-light border mt-auto">
                  <div className="small fw-semibold text-dark mb-1">Customer Acceptance Declaration:</div>
                  <p className="text-muted small m-0" style={{ fontSize: '11px' }}>
                    "I confirm that the solar rooftop system (3 kW) has been installed, earthing and safety wiring completed, and live power generation tested successfully in my presence."
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCENE 5: THE RAINY SEASON BREAKDOWN (SUB-SECOND WARRANTY LOOKUP) */}
        {/* ========================================================================= */}
        {activeTab === 'warranty' && (
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <h5 className="fw-bold m-0">🔍 Sub-Second Warranty Lookup</h5>
                  <span className="badge bg-primary">Instant Response</span>
                </div>
                <p className="text-muted small">
                  18 months later in pouring rain, customer calls with a fault code and zero power. Support finds customer & serial number within seconds.
                </p>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Search by Serial, Customer Name, or Phone</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 9841055667 or INV-3KW-2025-8841 or Meenakshi"
                      value={searchQuery}
                      onChange={e => handleWarrantySearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <button onClick={simulateRainySeasonBreakdown} className="btn btn-warning btn-sm w-100 fw-bold">
                    🌧️ Simulate Rainy Season Breakdown (Scene 5 from PDF)
                  </button>
                </div>

                {/* Instant Lookup Result Card */}
                {lookupResult ? (
                  <div className="p-4 rounded-4 border bg-light shadow-sm">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-dark">{lookupResult.serial}</span>
                      {new Date() < new Date(lookupResult.warrantyExpiry) ? (
                        <span className="badge bg-success fs-6">Under Active Warranty (₹0 Billed)</span>
                      ) : (
                        <span className="badge bg-danger fs-6">Warranty Expired (Chargeable)</span>
                      )}
                    </div>

                    <h5 className="fw-bold mb-1">{lookupResult.customerName}</h5>
                    <div className="text-muted small mb-2">📞 {lookupResult.phone} | Order: {lookupResult.orderId}</div>
                    <div className="small mb-1"><strong>Component:</strong> {lookupResult.itemName}</div>
                    <div className="small mb-1"><strong>Dispatched:</strong> {lookupResult.dispatchedDate}</div>
                    <div className="small mb-3"><strong>Warranty Expiry:</strong> {lookupResult.warrantyExpiry} ({lookupResult.warrantyYears} Years)</div>

                    {new Date() < new Date(lookupResult.warrantyExpiry) ? (
                      <div className="alert alert-success py-2 small mb-3">
                        <strong>₹0 Automatic Billing:</strong> Unit is 18 months into the 2-Year warranty. Free inverter replacement/repair covered under SunPower warranty!
                      </div>
                    ) : (
                      <div className="alert alert-warning py-2 small mb-3">
                        <strong>Automatic Billing:</strong> Warranty expired. Parts (₹4,200) + Labour (₹1,500) = <strong>₹5,700</strong> auto-invoiced to ticket.
                      </div>
                    )}

                    <button onClick={createSupportTicketForMatch} className="btn btn-dark w-100 fw-bold" style={{ background: '#19142d' }}>
                      <i className="bi bi-ticket-detailed me-1"></i> Log Support & Dispatch Repair Ticket
                    </button>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted border rounded-3 bg-light">
                    <i className="bi bi-search fs-2 d-block mb-2 text-secondary"></i>
                    Type a query or click the simulator above to search the warranty database in milliseconds.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Support Tickets & Resolution Tracker */}
            <div className="col-lg-6">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <h5 className="fw-bold m-0">🛠️ Active Support & Repair Tickets</h5>
                  <span className="badge bg-secondary">{tickets.length} Open</span>
                </div>
                <p className="text-muted small">
                  Track customer breakdowns until customer confirms everything works and power is restored.
                </p>

                <div className="d-flex flex-column gap-3">
                  {tickets.map(ticket => (
                    <div key={ticket.ticketId} className="p-3 rounded-3 border bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold font-monospace text-primary">{ticket.ticketId}</span>
                        <span className={`badge ${ticket.underWarranty ? 'bg-success' : 'bg-danger'}`}>
                          {ticket.underWarranty ? '₹0 Free Warranty Ticket' : 'Parts + Labour Billed'}
                        </span>
                      </div>
                      <div className="fw-bold text-dark">{ticket.customerName} ({ticket.phone})</div>
                      <div className="text-muted small">{ticket.itemName} — Serial: {ticket.serial}</div>
                      <div className="small text-danger fw-semibold mt-1">⚠️ {ticket.faultCode}</div>

                      <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top small">
                        <span>Assigned: <strong>{ticket.assignedTech}</strong></span>
                        <span className="fw-bold text-dark">Total: {formatINR(ticket.totalBilled)}</span>
                        <span className="badge bg-warning text-dark">{ticket.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCENE 6: THE DIRECTOR'S MONTH-END (JOB P&L & ANALYTICS) */}
        {/* ========================================================================= */}
        {activeTab === 'director' && (
          <div className="row g-4">
            {/* Executive Snapshot Cards */}
            <div className="col-lg-3 col-md-6">
              <div className="card border-0 rounded-4 shadow-sm p-3 bg-white">
                <span className="text-muted small text-uppercase fw-semibold">Net Invoiced Revenue</span>
                <h3 className="fw-bold text-dark m-0 mt-1">{formatINR(totalRevenue)}</h3>
                <span className="text-muted small">From {filteredOrders.length} completed projects</span>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="card border-0 rounded-4 shadow-sm p-3 bg-white">
                <span className="text-muted small text-uppercase fw-semibold">Hardware Stock Costs</span>
                <h3 className="fw-bold text-danger m-0 mt-1">{formatINR(totalHardwareCost)}</h3>
                <span className="text-muted small">Panels, Inverters, Metal Stands</span>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="card border-0 rounded-4 shadow-sm p-3 bg-white">
                <span className="text-muted small text-uppercase fw-semibold">Technician Labour Costs</span>
                <h3 className="fw-bold text-warning text-dark m-0 mt-1">{formatINR(totalLabourCost)}</h3>
                <span className="text-muted small">15 Technicians hours logged</span>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="card border-0 rounded-4 shadow-sm p-3 bg-white" style={{ borderLeft: '4px solid #10b981' }}>
                <span className="text-muted small text-uppercase fw-semibold">Net Profit & Margin</span>
                <h3 className="fw-bold text-success m-0 mt-1">{formatINR(totalNetProfit)}</h3>
                <span className="badge bg-success-subtle text-success">{overallMargin}% Net Margin</span>
              </div>
            </div>

            {/* Main P&L Table & Filters */}
            <div className="col-12">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2 border-bottom pb-3">
                  <div>
                    <h5 className="fw-bold m-0">📊 Job-Level Profit & Loss Engine</h5>
                    <p className="text-muted small m-0">Answer the Director's question: Which installations made money, and which lost money?</p>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {/* Time Period Filter */}
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        onClick={() => setDirectorPeriod('today')}
                        className={`btn ${directorPeriod === 'today' ? 'btn-dark' : 'btn-outline-secondary'}`}
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setDirectorPeriod('week')}
                        className={`btn ${directorPeriod === 'week' ? 'btn-dark' : 'btn-outline-secondary'}`}
                      >
                        This Week
                      </button>
                      <button
                        onClick={() => setDirectorPeriod('month')}
                        className={`btn ${directorPeriod === 'month' ? 'btn-dark' : 'btn-outline-secondary'}`}
                      >
                        This Month (~40 Target)
                      </button>
                    </div>

                    <button onClick={exportDirectorCSV} className="btn btn-success btn-sm fw-bold">
                      <i className="bi bi-file-earmark-spreadsheet me-1"></i> Export CSV Report
                    </button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle small">
                    <thead className="table-light">
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>kW Size</th>
                        <th>Revenue</th>
                        <th>Hardware Cost</th>
                        <th>Tech Hours & Labour</th>
                        <th>Net Profit</th>
                        <th>Margin</th>
                        <th>Analysis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(ord => {
                        const netProfit = ord.totalAmount - ord.hardwareCost - ord.labourCost;
                        const marginPercent = ((netProfit / ord.totalAmount) * 100).toFixed(1);
                        const isLoss = netProfit < 0;

                        return (
                          <tr key={ord.orderId} className={isLoss ? 'table-danger' : ''}>
                            <td className="fw-bold font-monospace">{ord.orderId}</td>
                            <td>
                              <div className="fw-semibold">{ord.customerName}</div>
                              <div className="text-muted" style={{ fontSize: '11px' }}>{ord.address}</div>
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border me-1">{ord.kw} kW</span>
                              <span className="badge bg-secondary">{ord.systemType}</span>
                            </td>
                            <td className="fw-bold text-dark">{formatINR(ord.totalAmount)}</td>
                            <td className="text-danger">{formatINR(ord.hardwareCost)}</td>
                            <td>
                              <div>{formatINR(ord.labourCost)}</div>
                              <div className="text-muted" style={{ fontSize: '11px' }}>{ord.techHours} hrs logged</div>
                            </td>
                            <td className={`fw-bold fs-6 ${isLoss ? 'text-danger' : 'text-success'}`}>
                              {formatINR(netProfit)}
                            </td>
                            <td>
                              <span className={`badge ${isLoss ? 'bg-danger' : 'bg-success'}`}>
                                {marginPercent}%
                              </span>
                            </td>
                            <td>
                              {isLoss ? (
                                <span className="small text-danger fw-semibold">
                                  ⚠️ Loss: Extra 52h rewire on roof
                                </span>
                              ) : (
                                <span className="small text-success fw-semibold">
                                  ✅ High Margin Standard Job
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Subsidies & 15-Technician Payroll Breakdown */}
                <div className="row g-3 mt-3 pt-3 border-top">
                  <div className="col-lg-6">
                    <h6 className="fw-bold text-dark mb-2">🏛️ Government Subsidy Paperwork Tracker</h6>
                    <div className="p-3 rounded-3 bg-light border">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Total Claimable Subsidies:</span>
                        <span className="fw-bold">{formatINR(2340000)}</span>
                      </div>
                      <div className="d-flex justify-content-between small mb-1 text-success">
                        <span>Disbursed from TANGEDCO / Ministry:</span>
                        <span className="fw-bold">{formatINR(1482000)}</span>
                      </div>
                      <div className="d-flex justify-content-between small mb-1 text-primary">
                        <span>Submitted & Under Inspection:</span>
                        <span className="fw-bold">{formatINR(546000)}</span>
                      </div>
                      <div className="d-flex justify-content-between small text-warning text-dark">
                        <span>Pending Customer Documentation:</span>
                        <span className="fw-bold">{formatINR(312000)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <h6 className="fw-bold text-dark mb-2">👷 15-Technician Field Force Payroll Engine</h6>
                    <div className="p-3 rounded-3 bg-light border">
                      {technicians.slice(0, 3).map(tech => (
                        <div key={tech.id} className="d-flex justify-content-between small mb-1">
                          <span>{tech.name} ({tech.role}):</span>
                          <span className="fw-bold">{formatINR(tech.hoursLogged * tech.rate)} ({tech.hoursLogged} hrs @ ₹{tech.rate}/hr)</span>
                        </div>
                      ))}
                      <div className="d-flex justify-content-between small text-muted">
                        <span>Field Riggers & Electricians (11 Staff):</span>
                        <span className="fw-bold">{formatINR(1420 * 280)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SunPowerERP;
