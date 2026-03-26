import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../store';
import { useAuth } from '../App';
import { ApplicationStatus, Application, Exam } from '../types';
import { Info, Calendar, Clock, Globe, Building, CheckCircle2 } from 'lucide-react';

const AvailableExams: React.FC = () => {
  const { auth } = useAuth();
  const user = auth.user!;
  const [showOnlyMyDept, setShowOnlyMyDept] = useState(false);
  const [apps, setApps] = useState<Application[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [justAppliedId, setJustAppliedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [a, e] = await Promise.all([db.getApplications(), db.getExams()]);
    setApps(a);
    setExams(e);
  };

  const availableExams = useMemo(() => {
    return exams.filter(e => {
      const deadlineDate = new Date(e.deadline);
      deadlineDate.setHours(23, 59, 59, 999);
      
      const isNotExpired = deadlineDate >= new Date();
      const alreadyApplied = apps.some(a => 
        (a.studentId === user.id || (a.studentId as any)._id === user.id) && 
        (a.examId === e.id || (a.examId as any)._id === e.id)
      );
      
      if (!isNotExpired || alreadyApplied) return false;
      
      if (showOnlyMyDept) {
        return e.department.toLowerCase() === user.department.toLowerCase();
      }
      
      return true;
    });
  }, [exams, apps, user.id, user.department, showOnlyMyDept]);

  const handleApply = async (examId: string) => {
    const newApp = {
      studentId: user.id,
      examId,
      appliedDate: new Date().toISOString(),
      status: ApplicationStatus.PENDING,
      remarks: ''
    };

    // 1. Update Persistent Storage
    await db.addApplication(newApp as any);
    
    // 2. Visual feedback
    setJustAppliedId(examId);
    
    // 3. Update local state to trigger UI removal of the card after a short delay
    setTimeout(async () => {
      await loadData();
      setJustAppliedId(null);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Available Exams</h1>
          <p className="text-slate-500">Register for upcoming examinations.</p>
        </div>
        
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
          <button 
            onClick={() => setShowOnlyMyDept(false)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${!showOnlyMyDept ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Globe size={14} />
            <span>All Exams</span>
          </button>
          <button 
            onClick={() => setShowOnlyMyDept(true)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${showOnlyMyDept ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Building size={14} />
            <span>My Dept ({user.department})</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {availableExams.map(exam => {
          const isMyDept = exam.department.toLowerCase() === user.department.toLowerCase();
          const isApplying = justAppliedId === exam.id;
          
          return (
            <div key={exam.id} className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-md border-t-4 ${isMyDept ? 'border-t-indigo-500' : 'border-t-slate-300'} ${isApplying ? 'opacity-50 scale-95' : ''}`}>
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    {exam.examCode}
                  </span>
                  {isMyDept && (
                    <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                      <Building size={10} />
                      <span>YOUR DEPT</span>
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{exam.examName}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{exam.description}</p>
                
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span>Exam Date</span>
                    </div>
                    <span className="font-semibold">{new Date(exam.examDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-red-50 text-red-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock size={14} className="text-red-400" />
                      <span>Apply By</span>
                    </div>
                    <span className="font-bold">{new Date(exam.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 pt-1 text-xs text-slate-400">
                    <Building size={12} />
                    <span>Dept: {exam.department}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-slate-100">
                <button 
                  disabled={isApplying}
                  onClick={() => handleApply(exam.id)}
                  className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg font-bold transition-all shadow-sm ${
                    isApplying 
                    ? 'bg-emerald-500 text-white cursor-default' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                  }`}
                >
                  {isApplying ? (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Applied!</span>
                    </>
                  ) : (
                    <span>Apply Now</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {availableExams.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Info size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-900 font-bold">No Exams Found</p>
            <p className="text-slate-500 max-w-xs text-center mt-1">
              {showOnlyMyDept 
                ? `There are no active exams in the ${user.department} department. Try switching to "All Exams".` 
                : "No upcoming exams are currently available for registration."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableExams;
