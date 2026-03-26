import React, { useState, useEffect } from 'react';
import { db } from '../store';
import { User, UserRole } from '../types';
import { useAuth } from '../App';
import { Plus, Search, Key, ShieldCheck, UserX, UserCheck, Trash2 } from 'lucide-react';

const UserManagement: React.FC = () => {
  const { auth } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.STUDENT,
    department: '',
    rollNumber: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await db.getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = {
      ...newUser,
      isActive: true,
    };
    await db.addUser(user as any); // Let the backend generate id and createdAt
    await loadUsers();
    setShowModal(false);
    setNewUser({ name: '', email: '', password: '', role: UserRole.STUDENT, department: '', rollNumber: '' });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId && newResetPassword) {
      await db.updateUser(selectedUserId, { password: newResetPassword });
      alert('Password reset successfully');
      setShowResetModal(false);
      setSelectedUserId(null);
      setNewResetPassword('');
      await loadUsers();
    }
  };

  const toggleUserStatus = async (id: string, current: boolean) => {
    await db.updateUser(id, { isActive: !current });
    await loadUsers();
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (id === auth.user?.id) {
      alert("You cannot delete your own administrative account.");
      return;
    }
    
    if (confirm(`Are you sure you want to delete user "${name}"? \n\nThis action is permanent and will also delete all associated exams and applications for this user.`)) {
      await db.deleteUser(id);
      await loadUsers();
    }
  };

  const studentDepartments = Array.from(
    new Set(
      users
        .filter((user) => user.role === UserRole.STUDENT)
        .map((user) => user.department?.trim())
        .filter((department): department is string => Boolean(department))
    )
  ).sort((a, b) => a.localeCompare(b));

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === 'all' ||
      u.role !== UserRole.STUDENT ||
      u.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  const inputClasses = "w-full px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">Manage, reset passwords, and monitor users.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Add New User</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {studentDepartments.length > 0 && (
          <div className="p-4 border-b border-slate-100 bg-slate-50/70">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Student Departments</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setSelectedDepartment('all')}
                className={`px-4 py-2 rounded-2xl border text-sm font-semibold transition-colors ${
                  selectedDepartment === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                All Students
              </button>
              {studentDepartments.map((department) => (
                <button
                  key={department}
                  type="button"
                  onClick={() => setSelectedDepartment(department)}
                  className={`px-4 py-2 rounded-2xl border text-sm font-semibold transition-colors ${
                    selectedDepartment === department
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {department}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                        u.role === UserRole.ADMIN ? 'bg-red-100 text-red-700' :
                        u.role === UserRole.STAFF ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                      u.role === UserRole.ADMIN ? 'bg-red-50 text-red-600' :
                      u.role === UserRole.STAFF ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center space-x-1.5 ${u.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-emerald-600' : 'bg-slate-400'}`}></div>
                      <span className="text-sm font-medium">{u.isActive ? 'Active' : 'Inactive'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                       <button 
                        onClick={() => { setSelectedUserId(u.id); setShowResetModal(true); }}
                        className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600"
                        title="Reset Password"
                      >
                        <Key size={16} />
                      </button>
                      <button 
                        onClick={() => toggleUserStatus(u.id, u.isActive)}
                        className={`p-1.5 rounded-md ${u.isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                        title={u.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {u.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1.5 hover:bg-red-50 rounded-md text-red-600"
                        title="Delete User Permanently"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-bold text-slate-900">Add New User</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4 bg-white">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input required type="text" className={inputClasses}
                  value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} placeholder="Enter full name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                <input required type="email" className={inputClasses}
                  value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Initial Password</label>
                <input required type="text" className={inputClasses}
                  value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} placeholder="Set initial password" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                  <select className={inputClasses}
                    value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}>
                    <option value={UserRole.STUDENT}>Student</option>
                    <option value={UserRole.STAFF}>Staff</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                  <input required type="text" className={inputClasses}
                    value={newUser.department} onChange={(e) => setNewUser({...newUser, department: e.target.value})} placeholder="e.g. Science" />
                </div>
              </div>
              {newUser.role === UserRole.STUDENT && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Roll Number</label>
                  <input required type="text" className={inputClasses}
                    value={newUser.rollNumber} onChange={(e) => setNewUser({...newUser, rollNumber: e.target.value})} placeholder="e.g. SN123" />
                </div>
              )}
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-bold text-slate-900">Reset User Password</h3>
              <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4 bg-white">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input required type="text" className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
                    value={newResetPassword} onChange={(e) => setNewResetPassword(e.target.value)} placeholder="Type new password" />
                </div>
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setShowResetModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
