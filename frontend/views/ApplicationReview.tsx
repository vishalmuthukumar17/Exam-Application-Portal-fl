import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../store';
import { useAuth } from '../App';
import { ApplicationStatus, UserRole, Application, Exam, User } from '../types';
import { CheckCircle, XCircle, Download, Search, Filter, ArrowLeft, Users, FileText } from 'lucide-react';

const ApplicationReview: React.FC = () => {
  const { auth } = useAuth();
  const user = auth.user!;
  const [searchParams, setSearchParams] = useSearchParams();
  const [apps, setApps] = useState<Application[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const selectedExamId = searchParams.get('examId') || '';

  const [reviewModal, setReviewModal] = useState<{ show: boolean, appId: string, action: 'approve' | 'reject' | null }>({
    show: false, appId: '', action: null
  });
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [a, e, u] = await Promise.all([db.getApplications(), db.getExams(), db.getUsers()]);
    setApps(a);
    setExams(e);
    setUsers(u);
  };

  const availableExams = useMemo(() => {
    if (user.role === UserRole.ADMIN) return exams || [];
    return (exams || []).filter((exam) => exam && (exam.createdBy === user.id || (exam.createdBy as any)?._id === user.id));
  }, [exams, user]);

  const appsForAvailableExams = useMemo(() => {
    const allowedExamIds = new Set(
      availableExams.map((exam) => exam.id).filter(Boolean)
    );

    return (apps || []).filter((app) => {
      const examId = typeof app.examId === 'string' ? app.examId : (app.examId as any)?._id;
      return allowedExamIds.has(examId);
    });
  }, [apps, availableExams]);

  const examCards = useMemo(() => {
    return availableExams.map((exam) => {
      const examApplications = appsForAvailableExams.filter((app) => {
        const appExamId = typeof app.examId === 'string' ? app.examId : (app.examId as any)?._id;
        return appExamId === exam.id;
      });

      return {
        exam,
        totalStudents: examApplications.length,
        pendingCount: examApplications.filter((app) => app.status === ApplicationStatus.PENDING).length,
        approvedCount: examApplications.filter((app) => app.status === ApplicationStatus.APPROVED).length,
        rejectedCount: examApplications.filter((app) => app.status === ApplicationStatus.REJECTED).length,
      };
    });
  }, [availableExams, appsForAvailableExams]);

  const selectedExam = useMemo(
    () => availableExams.find((exam) => exam.id === selectedExamId) || null,
    [availableExams, selectedExamId]
  );

  const filteredApps = useMemo(() => {
    if (!selectedExamId) return [];

    return appsForAvailableExams.filter((app) => {
      const student = (app.studentId as any)?.name ? (app.studentId as any) : users.find((u) => u.id === app.studentId);
      const exam = (app.examId as any)?.examName ? (app.examId as any) : exams.find((e) => e.id === app.examId);
      const examId = typeof app.examId === 'string' ? app.examId : (app.examId as any)?._id;
      const matchesExam = examId === selectedExamId;
      const matchesSearch =
        student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student?.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam?.examName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam?.examCode?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

      return matchesExam && matchesSearch && matchesStatus;
    });
  }, [selectedExamId, appsForAvailableExams, users, exams, searchTerm, statusFilter]);

  const departmentGroups = useMemo(() => {
    const groups = filteredApps.reduce((acc, app) => {
      const student = (app.studentId as any)?.name ? (app.studentId as any) : users.find((u) => u.id === app.studentId);
      const departmentName = student?.department || 'Unknown Department';
      if (!acc[departmentName]) {
        acc[departmentName] = [];
      }
      acc[departmentName].push(app);
      return acc;
    }, {} as Record<string, Application[]>);

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredApps, users]);

  useEffect(() => {
    if (selectedExamId && !selectedExam) {
      setSearchParams({});
    }
  }, [selectedExamId, selectedExam, setSearchParams]);

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModal.appId || !reviewModal.action) return;

    await db.updateApplication(reviewModal.appId, {
      status: reviewModal.action === 'approve' ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED,
      remarks,
      reviewedBy: user.id,
      reviewedAt: new Date().toISOString()
    });

    await loadData();
    setReviewModal({ show: false, appId: '', action: null });
    setRemarks('');
  };

  const exportCSV = () => {
    const headers = ['Student Name', 'Roll Number', 'Department', 'Exam Code', 'Exam Name', 'Date', 'Status'];
    const rows = filteredApps.map((app) => {
      const student = (app.studentId as any)?.name ? (app.studentId as any) : users.find((u) => u.id === app.studentId);
      const exam = (app.examId as any)?.examName ? (app.examId as any) : exams.find((e) => e.id === app.examId);
      return [
        student?.name || '',
        student?.rollNumber || '',
        student?.department || '',
        exam?.examCode || '',
        exam?.examName || '',
        new Date(app.appliedDate).toLocaleDateString(),
        app.status
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedExam?.examCode || 'applications'}_report.csv`;
    link.click();
  };

  const openExam = (examId: string) => {
    setSearchTerm('');
    setStatusFilter('all');
    setSearchParams({ examId });
  };

  const goBackToExamCards = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSearchParams({});
  };

  if (!selectedExam) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Exam Reviews</h1>
          <p className="text-slate-500">Choose an exam code to review the students registered for that exam.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {examCards.map(({ exam, totalStudents, pendingCount, approvedCount, rejectedCount }) => (
            <button
              key={exam.id}
              type="button"
              onClick={() => openExam(exam.id)}
              className="text-left bg-white rounded-3xl border border-slate-200 shadow-sm p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <span className="inline-flex px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 rounded-full">
                    {exam.examCode}
                  </span>
                  <h2 className="mt-4 text-xl font-bold text-slate-900">{exam.examName}</h2>
                  <p className="mt-2 text-sm text-slate-500">{exam.department}</p>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Users size={20} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Students</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{totalStudents}</p>
                </div>
                <div className="rounded-2xl bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Pending</p>
                  <p className="mt-1 text-2xl font-bold text-amber-700">{pendingCount}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Approved</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700">{approvedCount}</p>
                </div>
                <div className="rounded-2xl bg-red-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Rejected</p>
                  <p className="mt-1 text-2xl font-bold text-red-700">{rejectedCount}</p>
                </div>
              </div>
            </button>
          ))}

          {examCards.length === 0 && (
            <div className="col-span-full bg-white rounded-[2rem] border-2 border-dashed border-slate-200 px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                <FileText size={28} className="text-slate-300" />
              </div>
              <h2 className="mt-6 text-xl font-bold text-slate-900">No Exams Available</h2>
              <p className="mt-2 text-sm text-slate-500">Create an exam first, then you will be able to review the registered students here.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <button
            type="button"
            onClick={goBackToExamCards}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to exam codes</span>
          </button>
          <div>
            <div className="inline-flex px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 rounded-full">
              {selectedExam.examCode}
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">{selectedExam.examName}</h1>
            <p className="text-slate-500">Showing students registered for this exam.</p>
          </div>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center justify-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by student, roll number, or exam..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter size={18} className="text-slate-400" />
            <select
              className="px-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value={ApplicationStatus.PENDING}>Pending</option>
              <option value={ApplicationStatus.APPROVED}>Approved</option>
              <option value={ApplicationStatus.REJECTED}>Rejected</option>
            </select>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6 bg-slate-50/60">
          {departmentGroups.map(([departmentName, departmentApps]) => (
            <section key={departmentName} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{departmentName}</h2>
                  <p className="text-sm text-slate-500">Students registered from this department.</p>
                </div>
                <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {departmentApps.length} student{departmentApps.length === 1 ? '' : 's'}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Student Info</th>
                      <th className="px-6 py-4">Exam Name</th>
                      <th className="px-6 py-4">Applied Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {departmentApps.map((app) => {
                      const student = (app.studentId as any)?.name ? (app.studentId as any) : users.find((u) => u.id === app.studentId);
                      const exam = (app.examId as any)?.examName ? (app.examId as any) : exams.find((e) => e.id === app.examId);
                      return (
                        <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-900">{student?.name}</p>
                              <p className="text-xs text-slate-500">Roll: {student?.rollNumber}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <p className="font-medium text-indigo-600">{exam?.examName}</p>
                            <p className="text-xs text-slate-400">{exam?.examCode}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{new Date(app.appliedDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                              app.status === ApplicationStatus.APPROVED ? 'bg-emerald-100 text-emerald-700' :
                              app.status === ApplicationStatus.REJECTED ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end space-x-2">
                              {app.status === ApplicationStatus.PENDING && (
                                <>
                                  <button
                                    onClick={() => setReviewModal({ show: true, appId: app.id, action: 'approve' })}
                                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors"
                                    title="Approve"
                                  >
                                    <CheckCircle size={18} />
                                  </button>
                                  <button
                                    onClick={() => setReviewModal({ show: true, appId: app.id, action: 'reject' })}
                                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                                    title="Reject"
                                  >
                                    <XCircle size={18} />
                                  </button>
                                </>
                              )}
                              {app.status !== ApplicationStatus.PENDING && (
                                <div className="text-xs text-slate-400 italic pr-2">Reviewed</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          {departmentGroups.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              No applications found for this exam.
            </div>
          )}
        </div>
      </div>

      {reviewModal.show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 capitalize">{reviewModal.action} Application</h3>
              <button onClick={() => setReviewModal({ ...reviewModal, show: false })} className="text-slate-400 hover:text-slate-600">X</button>
            </div>
            <form onSubmit={handleReview} className="p-6 space-y-4">
              <p className="text-sm text-slate-600">Please provide {reviewModal.action === 'approve' ? 'remarks' : 'reason'} for this decision.</p>
              <textarea
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder={reviewModal.action === 'approve' ? 'Registration verified.' : 'Missing prerequisites.'}
                rows={4}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setReviewModal({ ...reviewModal, show: false })} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium">Cancel</button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${
                    reviewModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm {reviewModal.action}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationReview;
