import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sun, User as UserIcon, LogOut, ShieldCheck, ChevronDown } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, switchRole } = useAuth();

  const roleOptions = [
    { label: 'Admin (Full Access)', username: 'admin' },
    { label: 'Sales Lead', username: 'sales' },
    { label: 'Warehouse Manager', username: 'warehouse' },
    { label: 'Technician Lead', username: 'technician' },
    { label: 'Support Officer', username: 'support' },
    { label: 'Finance Manager', username: 'finance' },
    { label: 'Managing Director', username: 'director' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-amber-500 to-emerald-600 p-2 rounded-xl text-white shadow-sm flex items-center justify-center">
            <Sun className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">SunPower</span>
              <span className="text-xl font-light text-emerald-600">Solutions</span>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md border border-emerald-200">
                Enterprise ERP
              </span>
            </div>
            <p className="text-xs text-slate-500">Solar Project & Installation Management System</p>
          </div>
        </div>

        {/* Right Actions: Quick Role Switcher & User Profile */}
        <div className="flex items-center space-x-4">
          {/* Quick Evaluator Role Switcher */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-500">Active Role:</span>
            <select
              value={user?.username || 'admin'}
              onChange={(e) => switchRole(e.target.value)}
              className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              {roleOptions.map((opt) => (
                <option key={opt.username} value={opt.username}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* User profile info */}
          <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.fullName}</p>
              <p className="text-[11px] text-slate-500">{user?.roles?.[0]?.replace('ROLE_', '')}</p>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
