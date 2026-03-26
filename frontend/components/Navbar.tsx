
import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { UserRole } from '../types';

const Navbar: React.FC = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center md:hidden">
        <span className="text-xl font-bold text-indigo-600">Exam Portal</span>
      </div>

      <div className="hidden md:flex flex-1 items-center space-x-8">
        {auth.user?.role === UserRole.STUDENT && (
          <>
            <NavLink to="/dashboard" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>
              Home
            </NavLink>
            <NavLink to="/exams/available" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>
              Available Exams
            </NavLink>
            <NavLink to="/applications/my" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>
              My Applications
            </NavLink>
            <NavLink to="/hall-tickets" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>
              Hall Tickets
            </NavLink>
            <NavLink to="/profile/password" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>
              Change Password
            </NavLink>
          </>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden sm:block text-right">
          <p className="text-xs text-slate-500 font-medium">Welcome back,</p>
          <p className="text-sm font-semibold text-slate-800">{auth.user?.name}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="text-sm font-medium text-slate-600 hover:text-red-600 transition-colors bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
