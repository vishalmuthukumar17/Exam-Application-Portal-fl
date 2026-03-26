import React, { useState } from 'react';
import { db } from '../store';
import { useAuth } from '../App';
import { ShieldAlert, CheckCircle2, Key, Lock, Eye, EyeOff } from 'lucide-react';

const ChangePassword: React.FC = () => {
  const { auth } = useAuth();
  const user = auth.user!;
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [status, setStatus] = useState<{ type: 'error' | 'success' | null, message: string }>({ type: null, message: '' });
  const [showPasswords, setShowPasswords] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });

    if (formData.newPassword !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }

    const result = await db.changePassword(user.id, formData.oldPassword, formData.newPassword);
    if (result.success) {
      setStatus({ type: 'success', message: result.message });
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setStatus({ type: 'error', message: result.message });
    }
  };

  const inputClasses = "w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400";

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50">
          <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 mb-4">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
          <p className="text-slate-500 text-sm">Update your account credentials for better security.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
          {status.type && (
            <div className={`p-4 rounded-xl text-sm flex items-start space-x-3 border ${status.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
              }`}>
              {status.type === 'error' ? <ShieldAlert size={20} className="shrink-0" /> : <CheckCircle2 size={20} className="shrink-0" />}
              <span>{status.message}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Current Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  required
                  type={showPasswords ? "text" : "password"}
                  className={inputClasses}
                  value={formData.oldPassword}
                  onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  required
                  type={showPasswords ? "text" : "password"}
                  className={inputClasses}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  required
                  type={showPasswords ? "text" : "password"}
                  className={inputClasses}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Repeat new password"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-xs font-semibold text-indigo-600 flex items-center space-x-1 hover:underline"
            >
              {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
