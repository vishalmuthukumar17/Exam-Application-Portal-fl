import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../App';
import { UserRole, ApplicationStatus, Exam, Application, User, Notification } from '../types';
import { db } from '../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BellRing } from 'lucide-react';

const formatDate = (value?: string) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const Dashboard: React.FC = () => {
  const { auth } = useAuth();
  const user = auth.user!;
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    Promise.all([
      db.getExams(),
      db.getApplications(),
      db.getUsers(),
      db.getNotifications()
    ]).then(([e, a, u, n]) => {
      setExams(e);
      setApps(a);
      setUsers(u);
      setNotifications(n);
    });
  }, []);

  const stats = useMemo(() => {
    if (user.role === UserRole.ADMIN) {
      return [
        { label: 'Total Students', value: users.filter(u => u.role === UserRole.STUDENT).length, color: 'bg-blue-500' },
        { label: 'Total Staff', value: users.filter(u => u.role === UserRole.STAFF).length, color: 'bg-indigo-500' },
        { label: 'Total Exams', value: exams.length, color: 'bg-emerald-500' },
        { label: 'Total Applications', value: apps.length, color: 'bg-amber-500' },
      ];
    } else if (user.role === UserRole.STAFF) {
      const staffExams = exams.filter(e => e.createdBy === user.id || (e.createdBy as any)._id === user.id);
      const staffExamsIds = staffExams.map(e => e.id);
      const staffApps = apps.filter(a => staffExamsIds.includes(a.examId as any) || staffExamsIds.includes((a.examId as any)._id));
      
      return [
        { label: 'Exams Created', value: staffExams.length, color: 'bg-blue-500' },
        { label: 'Total Applications', value: staffApps.length, color: 'bg-indigo-500' },
        { label: 'Pending Review', value: staffApps.filter(a => a?.status === ApplicationStatus.PENDING).length, color: 'bg-amber-500' },
        { label: 'Approved Apps', value: staffApps.filter(a => a?.status === ApplicationStatus.APPROVED).length, color: 'bg-emerald-500' },
      ];
    } else {
      const studentApps = apps.filter(a => a.studentId === user.id || (a.studentId as any)._id === user.id);
      const alreadyAppliedIds = new Set(studentApps.map(a => a.examId as string | any).map(e => e.id || e._id || e));
      
      const openExams = (exams || []).filter(e => {
        if (!e?.deadline) return false;
        const deadlineDate = new Date(e.deadline);
        deadlineDate.setHours(23, 59, 59, 999);
        return deadlineDate >= new Date() && !alreadyAppliedIds.has(e.id);
      });

      return [
        { label: 'Available Exams', value: openExams.length, color: 'bg-blue-500' },
        { label: 'Applied', value: studentApps.length, color: 'bg-indigo-500' },
        { label: 'Approved', value: studentApps.filter(a => a?.status === ApplicationStatus.APPROVED).length, color: 'bg-emerald-500' },
        { label: 'Pending', value: studentApps.filter(a => a?.status === ApplicationStatus.PENDING).length, color: 'bg-amber-500' },
      ];
    }
  }, [user, exams, apps, users]);

  const chartData = useMemo(() => {
    const deptData: Record<string, number> = {};
    (exams || []).forEach(e => {
      deptData[e.department] = (deptData[e.department] || 0) + 1;
    });
    return Object.entries(deptData).map(([name, count]) => ({ name, count }));
  }, [exams]);

  const studentReminders = useMemo(() => {
    if (user.role !== UserRole.STUDENT) return [];

    const myApps = apps.filter(a => a.studentId === user.id || (a.studentId as any)._id === user.id);
    const now = new Date();

    return myApps
      .map((app) => {
        const exam = (app.examId as any)?.examName ? (app.examId as any) : exams.find(e => e.id === app.examId);
        if (!exam?.deadline) return null;

        const deadline = new Date(exam.deadline);
        deadline.setHours(23, 59, 59, 999);
        const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return {
          appId: app.id,
          examName: exam.examName,
          examCode: exam.examCode,
          deadline: exam.deadline,
          daysLeft,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 3);
  }, [user, apps, exams]);

  const seatingNotifications = useMemo(() => {
    if (user.role !== UserRole.STUDENT) return [];
    return notifications
      .filter((notification) => {
        const notificationUserId = typeof notification.userId === 'string' ? notification.userId : notification.userId.id;
        return notificationUserId === user.id && notification.type === 'seating_arrangement';
      })
      .slice(0, 4);
  }, [notifications, user]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Welcome back to the portal overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <div className={`h-10 w-10 rounded-lg ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                <div className={`h-2 w-2 rounded-full ${stat.color}`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {user.role === UserRole.STUDENT && studentReminders.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BellRing size={18} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Upcoming Deadlines</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {studentReminders.map((item) => (
              <div key={item.appId} className={`rounded-2xl border p-4 ${
                item.daysLeft <= 2 ? 'bg-red-50 border-red-200' : item.daysLeft <= 7 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
              }`}>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">{item.examCode}</p>
                <p className="mt-2 font-bold text-slate-900">{item.examName}</p>
                <p className="mt-2 text-sm text-slate-600">Deadline: {new Date(item.deadline).toLocaleDateString()}</p>
                <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  item.daysLeft <= 2 ? 'bg-red-100 text-red-700' : item.daysLeft <= 7 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {item.daysLeft <= 0 ? 'Deadline today / passed' : `${item.daysLeft} day${item.daysLeft === 1 ? '' : 's'} left`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {user.role === UserRole.STUDENT && seatingNotifications.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BellRing size={18} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Seating Notifications</h2>
          </div>
          <div className="space-y-3">
            {seatingNotifications.map((notification) => (
              <div key={notification.id} className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-4">
                <p className="text-sm font-bold text-slate-900">{notification.title}</p>
                <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {notification.meta?.arrangementDate && (
                    <span className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                      {formatDate(notification.meta.arrangementDate)}
                    </span>
                  )}
                  {notification.meta?.hallName && (
                    <span className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                      {notification.meta.hallName}
                    </span>
                  )}
                  {notification.meta?.seatNumber && (
                    <span className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                      {notification.meta.seatNumber}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Exams by Department</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {(apps || []).slice(-5).reverse().map((app, i) => {
              if (!app) return null;
              const studentName = (app.studentId as any)?.name || users.find(u => u.id === app.studentId)?.name;
              const examName = (app.examId as any)?.examName || exams.find(e => e.id === app.examId)?.examName;

              return (
                <div key={i} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`h-2 w-2 rounded-full ${app.status === ApplicationStatus.APPROVED ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{studentName} applied for {examName}</p>
                    <p className="text-xs text-slate-500">{new Date(app.appliedDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                    app.status === ApplicationStatus.APPROVED ? 'bg-emerald-100 text-emerald-700' : 
                    app.status === ApplicationStatus.REJECTED ? 'bg-red-100 text-red-700' : 
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {app.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
