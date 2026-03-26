import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../store';
import { useAuth } from '../App';
import { Exam, User, UserRole } from '../types';
import { Plus, Trash2, Edit3, Calendar, Clock, Building, FileText, X } from 'lucide-react';

const ExamManagement: React.FC = () => {
  const { auth } = useAuth();
  const user = auth.user!;
  const [exams, setExams] = useState<Exam[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const [formData, setFormData] = useState({
    examCode: '',
    examName: '',
    examDate: '',
    deadline: '',
    department: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [e, u] = await Promise.all([db.getExams(), db.getUsers()]);
    setExams(e);
    setUsers(u);
  };

  const displayExams = useMemo(() => {
    if (user.role === UserRole.ADMIN) return exams || [];
    return (exams || []).filter(e => {
      if (!e) return false;
      return e.createdBy === user.id || (e.createdBy as any)?._id === user.id;
    });
  }, [exams, user]);

  const departmentOptions = useMemo(() => {
    const departments = users
      .map((entry) => entry.department?.trim())
      .filter((department): department is string => Boolean(department));

    return Array.from(new Set(departments)).sort((a, b) => a.localeCompare(b));
  }, [users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExam) {
      await db.updateExam(editingExam.id, formData);
    } else {
      const newExam = {
        ...formData,
        createdBy: user.id
      };
      await db.addExam(newExam as any);
    }
    await loadData();
    handleCloseModal();
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      examCode: exam.examCode,
      examName: exam.examName,
      examDate: exam.examDate,
      deadline: exam.deadline,
      department: exam.department,
      description: exam.description,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure? This will also delete all applications for this exam.")) {
      await db.deleteExam(id);
      await loadData();
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExam(null);
    setFormData({ examCode: '', examName: '', examDate: '', deadline: '', department: '', description: '' });
  };

  const inputClasses = "w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white focus-within:border-indigo-400 transition-all shadow-sm";
  const today = new Date().toISOString().split('T')[0];

  const DatePickerField = ({ label, value, onChange, min }: { label: string, value: string, onChange: (val: string) => void, min?: string }) => (
    <div className="space-y-1.5 flex-1">
      <label className="block text-sm font-bold text-slate-700 ml-1">{label}</label>
      <div className="relative h-[52px]">
        <input 
          required 
          type="date" 
          min={min}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20 appearance-none"
          value={value}
          onClick={(e) => {
            try { (e.currentTarget as any).showPicker(); } catch(err) {}
          }}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className={`${inputClasses} absolute inset-0 flex items-center justify-between pointer-events-none group-hover:border-indigo-300 transition-colors`}>
          <span className={`text-sm ${value ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}`}>
            {value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pick Date'}
          </span>
          <Calendar size={18} className="text-indigo-500" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:items-center sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{user.role === UserRole.ADMIN ? 'Monitor Exams' : 'My Exams'}</h1>
          <p className="text-slate-500 text-sm">{user.role === UserRole.ADMIN ? 'Oversee all academic examinations.' : 'Create and manage your courses examinations.'}</p>
        </div>
        {user.role === UserRole.STAFF && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 font-bold"
          >
            <Plus size={22} />
            <span>Create Exam</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(displayExams || []).map(exam => {
          if (!exam) return null;
          const authorName = (exam.createdBy as any)?.name || (exam.createdBy ? users.find(u => u.id === (typeof exam.createdBy === 'string' ? exam.createdBy : (exam.createdBy as any)?._id))?.name : 'Faculty') || 'Faculty';

          return (
          <div key={exam.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="p-7 flex-1">
              <div className="flex justify-between items-start mb-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100/50">
                  {exam.examCode}
                </span>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(exam)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(exam.id)} className="p-2 hover:bg-red-50 rounded-xl text-red-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{exam.examName}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-6 leading-relaxed">{exam.description}</p>
              
              <div className="space-y-3.5 pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 text-slate-400">
                    <Calendar size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Exam Date</span>
                  </div>
                  <span className="font-bold text-slate-700">{new Date(exam.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 text-slate-400">
                    <Clock size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Deadline</span>
                  </div>
                  <span className="font-bold text-red-600">{new Date(exam.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-400 pt-2">
                  <Building size={14} />
                  <span className="truncate italic">{exam.department}</span>
                </div>
              </div>
            </div>
            
            <div className="px-7 py-4 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-indigo-600 shadow-sm">
                  {authorName?.charAt(0) || '?'}
                </div>
                <span className="text-xs text-slate-400 font-semibold tracking-wide">
                  By {authorName}
                </span>
              </div>
            </div>
          </div>
        )})}

        {displayExams.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <div className="p-6 bg-slate-50 rounded-full mb-6">
              <FileText size={64} className="text-slate-200" />
            </div>
            <p className="text-slate-900 font-extrabold text-xl">No Exams Scheduled</p>
            <p className="text-slate-400 mt-2">Get started by creating a new examination entry.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-white/20 animate-in fade-in zoom-in duration-200">
            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 leading-none">{editingExam ? 'Edit Schedule' : 'New Exam'}</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">Configure examination details and dates.</p>
              </div>
              <button onClick={handleCloseModal} className="p-2.5 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 overflow-y-auto bg-white scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 ml-1">Exam Code</label>
                  <input 
                    required placeholder="e.g. CS101"
                    type="text" className={inputClasses}
                    value={formData.examCode}
                    onChange={(e) => setFormData({...formData, examCode: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 ml-1">Exam Name</label>
                  <input 
                    required placeholder="e.g. Intro to ML"
                    type="text" className={inputClasses}
                    value={formData.examName}
                    onChange={(e) => setFormData({...formData, examName: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <DatePickerField 
                  label="Exam Date" 
                  value={formData.examDate} 
                  min={today}
                  onChange={(val) => setFormData({...formData, examDate: val})} 
                />
                <DatePickerField 
                  label="Deadline" 
                  value={formData.deadline} 
                  min={today}
                  onChange={(val) => setFormData({...formData, deadline: val})} 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700 ml-1">Department</label>
                <div className="relative group">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={18} />
                  <select
                    required
                    className={inputClasses.replace('px-4', 'pl-12')}
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  >
                    <option value="">Select Department</option>
                    {departmentOptions.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700 ml-1">Instructions / Description</label>
                <textarea 
                  required rows={3} className={`${inputClasses} resize-none`} placeholder="Describe syllabus and requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              
              <div className="pt-4 flex space-x-4 shrink-0">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-3.5 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]">
                  {editingExam ? 'Save Changes' : 'Post Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
