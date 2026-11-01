import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

// 1. Solar Panel Module Industrial Icon
export const SolarPanelIcon: React.FC<IconProps> = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3 15L6.2 4H17.8L21 15H3Z" stroke="#e63a27" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="rgba(230, 58, 39, 0.08)" />
    <path d="M7.5 4L6 15" stroke="#e63a27" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M12 4V15" stroke="#e63a27" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M16.5 4L18 15" stroke="#e63a27" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M4.6 9.5H19.4" stroke="#e63a27" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 15V20M8 20H16" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="2" r="1" fill="#f59e0b" />
    <path d="M5.5 1.5L6.5 2.5M18.5 1.5L17.5 2.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 2. Hybrid Inverter & Micro-Inverter Industrial Icon
export const HybridInverterIcon: React.FC<IconProps> = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="4" y="3" width="16" height="18" rx="2.5" stroke="#0284c7" strokeWidth="1.8" fill="rgba(2, 132, 199, 0.08)" />
    <rect x="7" y="6" width="10" height="4.5" rx="1" fill="#0f172a" />
    <path d="M9 8.25H11M13 8.25H15" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 14C8 12.5 9 12.5 10 14C11 15.5 12 15.5 13 14M14 14C15 12.5 16 12.5 17 14" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="8" cy="18" r="1" fill="#f59e0b" />
    <circle cx="12" cy="18" r="1" fill="#10b981" />
    <circle cx="16" cy="18" r="1" fill="#0284c7" />
  </svg>
);

// 3. Government Subsidy & Certified Seal Icon
export const SubsidySealIcon: React.FC<IconProps> = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2L15 4.5L19 4L20 8L23 10.5L21.5 14L23 17.5L20 20L19 24L15 23.5L12 26L9 23.5L5 24L4 20L1 17.5L2.5 14L1 10.5L4 8L5 4L9 4.5L12 2Z" fill="rgba(16, 185, 129, 0.12)" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M9 13L11.2 15.2L15.5 10" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 4. LiFePO4 Battery Storage Unit Industrial Icon
export const BatteryBankIcon: React.FC<IconProps> = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="6" width="18" height="15" rx="2.5" stroke="#f59e0b" strokeWidth="1.8" fill="rgba(245, 158, 11, 0.08)" />
    <path d="M8 3V6M16 3V6" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 9.5V17.5M9.5 13.5L12 9.5L14.5 13.5" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 10.5H7.5M16.5 10.5H18M17.25 9.75V11.25" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 5. Smart Bi-Directional Net Meter Industrial Icon
export const SmartMeterIcon: React.FC<IconProps> = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" stroke="#6366f1" strokeWidth="1.8" fill="rgba(99, 102, 241, 0.08)" />
    <rect x="7" y="7" width="10" height="4.5" rx="1" fill="#0f172a" />
    <path d="M8.5 9.25H10.5M11.5 9.25H13.5M14.5 9.25H15.5" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M12 13.5L15.5 15.5M12 13.5L8.5 15.5" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 18H16" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 6. Turnkey Industrial EPC Powerplant Icon
export const IndustrialEpcIcon: React.FC<IconProps> = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M2 21H22" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M4 21V11L9 15V11L14 15V7L20 12V21" stroke="#e63a27" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(230, 58, 39, 0.06)" />
    <path d="M6 17.5H8M11 17.5H13M16 17.5H18M16 13.5H18" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="17" cy="4" r="2" stroke="#f59e0b" strokeWidth="1.5" />
    <path d="M17 1V2M20 4H19M17 6V7M15 4H14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Blueprint Rooftop Footprint Spec Icon
export const RoofFootprintIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3 8V5C3 3.89543 3.89543 3 5 3H8M16 3H19C20.1046 3 21 3.89543 21 5V8M21 16V19C21 20.1046 20.1046 21 19 21H16M8 21H5C3.89543 21 3 20.1046 3 19V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 12H17M12 7V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Daily Yield kWh Power Icon
export const EnergyYieldIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// PV Half-Cut Modules Grid Icon
export const PvModulesGridIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 9H21M3 15H21M9 3V21M15 3V21" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

// Map of industrial icons by key
export const getPackageIcon = (type: string, size = 32) => {
  switch (type) {
    case '1kw':
      return <SolarPanelIcon size={size} />;
    case '2kw':
      return <HybridInverterIcon size={size} />;
    case '3kw':
      return <SubsidySealIcon size={size} />;
    case '4kw':
      return <BatteryBankIcon size={size} />;
    case '5kw':
      return <SmartMeterIcon size={size} />;
    case 'custom':
    default:
      return <IndustrialEpcIcon size={size} />;
  }
};
