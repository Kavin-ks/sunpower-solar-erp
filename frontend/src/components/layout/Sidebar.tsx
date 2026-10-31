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
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const roleName = user?.roles?.[0]?.replace('ROLE_', '') || 'STAFF';

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Enquiries & Leads', path: '/enquiries', icon: Users },
    { name: 'Site Surveys', path: '/surveys', icon: Compass },
    { name: 'Quotations', path: '/quotations', icon: FileText },
    { name: 'Orders & Payments', path: '/orders', icon: ShoppingCart },
    { name: 'Inventory & Stock', path: '/inventory', icon: Boxes },
    { name: 'Dispatch & Serials', path: '/dispatch', icon: Truck },
    { name: 'Installations', path: '/installations', icon: Wrench },
    { name: 'Warranty Tracker', path: '/warranties', icon: ShieldAlert },
    { name: 'Service Tickets', path: '/service', icon: Headphones },
    { name: 'Finance & P&L', path: '/finance', icon: CircleDollarSign },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-61px)] flex flex-col justify-between py-4 select-none shrink-0">
      <div className="px-3 space-y-1">
        <div className="mb-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
            {isAdmin ? 'System Portal' : 'Active Department'}
          </span>
          <span className="text-xs font-bold text-slate-800">{roleName}</span>
        </div>
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Core Workflows
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border-l-4 border-emerald-600 pl-2'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-slate-700" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
        <p className="font-medium text-slate-600">SunPower Operations v1.0</p>
        <p>40 Projects / Month Target</p>
      </div>
    </aside>
  );
};
