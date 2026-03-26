import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../store';
import { useAuth } from '../App';
import { ApplicationStatus, Application, Exam } from '../types';
import { Clock, CheckCircle, XCircle, Trash2, AlertCircle, BellRing, CalendarClock } from 'lucide-react';

const MyApplications: React.FC = () => {
  const { auth } = useAuth();
  const user = auth.user!;
  const [apps, setApps] = useState<Application[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [a, e] = await Promise.all([db.getApplications(), db.getExams()]);
    setApps(a.filter(app => app.studentId === user.id || (app.studentId as any)._id === user.id));
    setExams(e);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Withdraw this application?")) {
      await db.deleteApplication(id);
      await loadData();
    }
  };

  const reminders = useMemo(() => {
    const now = new Date();

    return apps
      .map((app) => {
        const exam = (app.examId as any)?.examName ? (app.examId as any) : exams.find(e => e.id === app.examId);
        if (!exam?.deadline) return null;

        const deadline = new Date(exam.deadline);
        deadline.setHours(23, 59, 59, 999);
        const diffMs = deadline.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let tone = 'normal';
        if (daysLeft < 0) tone = 'expired';
        else if (daysLeft <= 2) tone = 'urgent';
        else if (daysLeft <= 7) tone = 'soon';

        return {
          app,
          exam,
          daysLeft,
          tone,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => new Date(a.exam.deadline).getTime() - new Date(b.exam.deadline).getTime());
  }, [apps, exams]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
        <p className="text-slate-500">Track and manage your submitted exam requests.</p>
      </div>

      {reminders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BellRing size={18} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Upcoming Deadlines</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {reminders.slice(0, 3).map(({ exam, daysLeft, tone, app }) => (
              <div
                key={app.id}
                className={`rounded-2xl border p-5 shadow-sm ${
                  tone === 'urgent'
                    ? 'bg-red-50 border-red-200'
                    : tone === 'soon'
                    ? 'bg-amber-50 border-amber-200'
                    : tone === 'expired'
                    ? 'bg-slate-100 border-slate-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">{exam.examCode}</p>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">{exam.examName}</h3>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      tone === 'urgent'
                        ? 'bg-red-100 text-red-700'
                        : tone === 'soon'
                        ? 'bg-amber-100 text-amber-700'
                        : tone === 'expired'
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {tone === 'expired' ? 'Closed' : daysLeft === 0 ? 'Today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <CalendarClock size={16} className="text-slate-400" />
                  <span>Deadline: {new Date(exam.deadline).toLocaleDateString()}</span>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {tone === 'urgent'
                    ? 'Action needed soon. This exam deadline is very close.'
                    : tone === 'soon'
                    ? 'Reminder: this exam deadline is coming up this week.'
                    : tone === 'expired'
                    ? 'The registration deadline has already passed.'
                    : 'You still have time before this registration deadline closes.'}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Reminder Table</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Exam</th>
                    <th className="px-6 py-4">Exam Date</th>
                    <th className="px-6 py-4">Deadline</th>
                    <th className="px-6 py-4">Reminder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reminders.map(({ exam, daysLeft, tone, app }) => (
                    <tr key={`reminder-${app.id}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{exam.examName}</p>
                        <p className="text-xs text-slate-500">Code: {exam.examCode}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{new Date(exam.examDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{new Date(exam.deadline).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                            tone === 'urgent'
                              ? 'bg-red-100 text-red-700'
                              : tone === 'soon'
                              ? 'bg-amber-100 text-amber-700'
                              : tone === 'expired'
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {tone === 'expired' ? 'Expired' : daysLeft === 0 ? 'Deadline today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Exam Details</th>
                <th className="px-6 py-4">Applied Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Reviewer Remarks</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.map((a) => {
                const exam = (a.examId as any)?.examName ? (a.examId as any) : exams.find(e => e.id === a.examId);
                const isPending = a.status === ApplicationStatus.PENDING;
                
                return (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{exam?.examName}</p>
                        <p className="text-xs text-slate-500">Code: {exam?.examCode}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(a.appliedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {a.status === ApplicationStatus.PENDING && <Clock size={16} className="text-amber-500" />}
                        {a.status === ApplicationStatus.APPROVED && <CheckCircle size={16} className="text-emerald-500" />}
                        {a.status === ApplicationStatus.REJECTED && <XCircle size={16} className="text-red-500" />}
                        <span className={`text-sm font-bold capitalize ${
                          a.status === ApplicationStatus.APPROVED ? 'text-emerald-700' : 
                          a.status === ApplicationStatus.REJECTED ? 'text-red-700' : 
                          'text-amber-700'
                        }`}>
                          {a.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 max-w-xs truncate" title={a.remarks}>
                        {a.remarks || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isPending ? (
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleDelete(a.id)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Withdraw Application"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Locked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <AlertCircle size={40} className="text-slate-200 mb-2" />
                      <p className="text-slate-400">You haven't applied for any exams yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyApplications;
