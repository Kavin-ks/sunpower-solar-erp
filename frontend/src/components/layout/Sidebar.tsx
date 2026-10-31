import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Compass,
  FileText,
  ShoppingCart,
  Boxes,
  Truck,
  Wrench,
  ShieldAlert,
  Headphones,
  CircleDollarSign,
  Eye,
  CheckCircle2,
  CalendarCheck2,
  PackageSearch,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const roles = user?.roles || [];
  const isAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ROLE_DIRECTOR');
  const isSales = roles.includes('ROLE_SALES');
  const isWarehouse = roles.includes('ROLE_WAREHOUSE');
  const isTechnician = roles.includes('ROLE_TECHNICIAN');
  const isSupport = roles.includes('ROLE_SUPPORT');
  const isFinance = roles.includes('ROLE_FINANCE');

  const getDepartmentConfig = () => {
    if (isAdmin) {
      return {
        badge: 'Executive Oversight',
        deptName: 'Executive Director',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        sectionLabel: 'System-Wide Workspaces (Audit View)',
        items: [
          { name: 'Executive Overview', path: '/', icon: LayoutDashboard },
          { name: 'Enquiries & Leads (Audit)', path: '/enquiries', icon: Users },
          { name: 'Site Surveys (Audit)', path: '/surveys', icon: Compass },
          { name: 'Quotations & BOM (Audit)', path: '/quotations', icon: FileText },
          { name: 'Orders & Payments (Audit)', path: '/orders', icon: ShoppingCart },
          { name: 'Inventory & Stock (Audit)', path: '/inventory', icon: Boxes },
          { name: 'Dispatch & Serials (Audit)', path: '/dispatch', icon: Truck },
          { name: 'Installations (Audit)', path: '/installations', icon: Wrench },
          { name: 'Warranty Tracker (Audit)', path: '/warranties', icon: ShieldAlert },
          { name: 'Service Tickets (Audit)', path: '/service', icon: Headphones },
          { name: 'Finance & P&L (Audit)', path: '/finance', icon: CircleDollarSign },
        ],
      };
    }
    if (isSales) {
      return {
        badge: 'Sales Workspace',
        deptName: 'Commercial & Sales',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        sectionLabel: 'Sales Workflows',
        items: [
          { name: 'Sales Dashboard', path: '/', icon: LayoutDashboard },
          { name: 'Customer Enquiries & Leads', path: '/enquiries', icon: Users },
          { name: 'Survey Scheduling & Review', path: '/surveys', icon: Compass },
          { name: 'Quotations & Dynamic BOM', path: '/quotations', icon: FileText },
          { name: 'Orders & Payment Status', path: '/orders', icon: ShoppingCart },
          { name: 'Stock Availability (View Only)', path: '/inventory', icon: Boxes },
        ],
      };
    }
    if (isWarehouse) {
      return {
        badge: 'Warehouse Workspace',
        deptName: 'Inventory & Dispatch',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        sectionLabel: 'Warehouse Workflows',
        items: [
          { name: 'Warehouse Dashboard', path: '/', icon: LayoutDashboard },
          { name: 'Inventory Catalogue & Stock', path: '/inventory', icon: Boxes },
          { name: 'Order Picking & Barcode Dispatch', path: '/dispatch', icon: Truck },
          { name: 'Confirmed Orders Queue', path: '/orders', icon: ShoppingCart },
          { name: 'Serial & Barcode Verification', path: '/warranties', icon: PackageSearch },
        ],
      };
    }
    if (isTechnician) {
      return {
        badge: 'Technician Workspace',
        deptName: 'Field & Commissioning',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        sectionLabel: 'Field Operations',
        items: [
          { name: 'Technician Dashboard', path: '/', icon: LayoutDashboard },
          { name: 'Assigned Site Surveys', path: '/surveys', icon: Compass },
          { name: 'Installations & On-Site Verification', path: '/installations', icon: Wrench },
          { name: 'Assigned Service Visits', path: '/service', icon: Headphones },
        ],
      };
    }
    if (isSupport) {
      return {
        badge: 'Support Workspace',
        deptName: 'Customer Care & Warranty',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        sectionLabel: 'Support Operations',
        items: [
          { name: 'Support Dashboard', path: '/', icon: LayoutDashboard },
          { name: 'Service Tickets & Complaints', path: '/service', icon: Headphones },
          { name: 'Serial & Warranty Tracker', path: '/warranties', icon: ShieldAlert },
          { name: 'Completed Installations', path: '/installations', icon: CheckCircle2 },
        ],
      };
    }
    if (isFinance) {
      return {
        badge: 'Finance Workspace',
        deptName: 'Accounts & Profitability',
        badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
        sectionLabel: 'Accounting Workflows',
        items: [
          { name: 'Finance Dashboard', path: '/', icon: LayoutDashboard },
          { name: 'GST Invoices & Receivables', path: '/finance', icon: CircleDollarSign },
          { name: 'Payment Verification Ledger', path: '/orders', icon: ShoppingCart },
          { name: 'Approved Quotations', path: '/quotations', icon: FileText },
          { name: 'Subsidy & Expense Tracker', path: '/finance', icon: CalendarCheck2 },
        ],
      };
    }

    return {
      badge: 'Staff Portal',
      deptName: user?.username || 'Staff',
      badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
      sectionLabel: 'Standard Workflows',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Enquiries', path: '/enquiries', icon: Users },
        { name: 'Site Surveys', path: '/surveys', icon: Compass },
      ],
    };
  };

  const config = getDepartmentConfig();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-61px)] flex flex-col justify-between py-4 select-none shrink-0 shadow-xs">
      <div className="px-3 space-y-1">
        {/* Department Badge Card */}
        <div className={`mb-3 px-3 py-2.5 rounded-xl border ${config.badgeColor} shadow-2xs`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold tracking-wider uppercase block">
              {config.badge}
            </span>
            {isAdmin && <Eye className="w-3.5 h-3.5 opacity-70" />}
          </div>
          <span className="text-xs font-bold text-slate-900 block mt-0.5">{config.deptName}</span>
        </div>

        {/* Section Header */}
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {config.sectionLabel}
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          {config.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border-l-4 border-emerald-600 pl-2 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-slate-700" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Footer System Status */}
      <div className="px-5 py-3 border-t border-slate-100 text-[11px] text-slate-400">
        <div className="flex items-center space-x-2 text-slate-600 font-semibold mb-0.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>SunPower ERP Central</span>
        </div>
        <p className="text-[10px] text-slate-400">Connected: Central MySQL Database</p>
      </div>
    </aside>
  );
};

export default Sidebar;
