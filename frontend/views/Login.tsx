
import React, { useState } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Mail, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials or account inactive.');
    }
  };

  const inputClasses = "w-full pl-10 pr-4 py-3 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 shadow-sm";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-indigo-600 text-white shadow-2xl shadow-indigo-200 mb-6 transform -rotate-3 transition-transform hover:rotate-0">
            <GraduationCap size={48} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Exam Application Portal</h1>
          <p className="text-slate-500 mt-3 font-medium text-lg">Unified Exam Management System</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 p-10">
          <form onSubmit={handleSubmit} className="space-y-6 bg-white">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center space-x-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse"></div>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required type="email" 
                  className={inputClasses}
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-700 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required type="password" 
                  className={inputClasses}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 group active:scale-[0.98]"
              >
                <span className="text-lg">Sign In</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-slate-400 text-sm font-medium">
            Contact your department for access assistance.
          </p>
        </div>
        
        <p className="mt-10 text-center text-slate-300 text-xs font-bold uppercase tracking-widest">
          &copy; 2024 Exam Management Portal v2.0
        </p>
      </div>
    </div>
  );
};

export default Login;
