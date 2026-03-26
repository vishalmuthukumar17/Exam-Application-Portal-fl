
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../App';
import { UserRole } from '../types';
import { LayoutDashboard, Users, FileText, CheckCircle, GraduationCap, Lock, Grid3X3, Ticket } from 'lucide-react';

const Sidebar: React.FC = () => {
  const { auth } = useAuth();
  const role = auth.user?.role;

  const NavItem: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        flex items-center space-x-3 p-3 rounded-lg transition-colors
        ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-600 hover:bg-slate-100'}
      `}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </NavLink>
  );

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 hidden md:flex">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-8 w-8 text-indigo-600" />
          <span className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Exam Portal</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 py-4">
        <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
        
        {role === UserRole.ADMIN && (
          <NavItem to="/users" icon={<Users size={20} />} label="User Management" />
        )}

        {role === UserRole.ADMIN && (
          <NavItem to="/seating-arrangement" icon={<Grid3X3 size={20} />} label="Seating Arrangement" />
        )}

        {role === UserRole.ADMIN && (
          <NavItem to="/hall-ticket-dispatch" icon={<Ticket size={20} />} label="Hall Tickets" />
        )}

        <NavItem to="/exams" icon={<FileText size={20} />} label={role === UserRole.ADMIN ? "Monitor Exams" : "My Exams"} />
        
        <NavItem to="/applications/review" icon={<CheckCircle size={20} />} label={role === UserRole.ADMIN ? "Monitor Apps" : "Reviews"} />
        
        <div className="pt-4 mt-4 border-t border-slate-100">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Account</p>
          <NavItem to="/profile/password" icon={<Lock size={20} />} label="Change Password" />
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="flex items-center space-x-3 px-2">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            {auth.user?.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">{auth.user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{auth.user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
