import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarDays, Send, Ticket } from 'lucide-react';
import { db } from '../store';
import { Notification, SeatingArrangement } from '../types';

const formatDate = (value?: string) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const AdminHallTickets: React.FC = () => {
  const [arrangements, setArrangements] = useState<SeatingArrangement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sendingDate, setSendingDate] = useState('');
  const [status, setStatus] = useState<Record<string, string>>({});

  const loadData = async () => {
    const [arrangementData, notificationData] = await Promise.all([
      db.getSeatingArrangements(),
      db.getNotifications(),
    ]);
    setArrangements(arrangementData);
    setNotifications(notificationData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const dateGroups = useMemo(() => {
    const grouped = new Map<string, SeatingArrangement[]>();

    arrangements
      .filter((arrangement) => arrangement.totalAssigned > 0 && arrangement.arrangementDate)
      .forEach((arrangement) => {
        const dateKey = arrangement.arrangementDate || '';
        if (!grouped.has(dateKey)) grouped.set(dateKey, []);
        grouped.get(dateKey)!.push(arrangement);
      });

    return Array.from(grouped.entries())
      .map(([date, items]) => ({
        date,
        arrangements: items.sort((a, b) => (a.title || '').localeCompare(b.title || '')),
        totalAssigned: items.reduce((sum, item) => sum + item.totalAssigned, 0),
        totalStudents: items.reduce((sum, item) => sum + item.totalStudents, 0),
        totalUnassigned: items.reduce((sum, item) => sum + item.unassignedCount, 0),
        totalHalls: items.reduce((sum, item) => sum + item.halls.length, 0),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [arrangements]);

  const notificationStats = useMemo(() => {
    const grouped = new Map<string, { delivered: number; opened: number }>();

    notifications
      .filter((notification) => notification.type === 'hall_ticket')
      .forEach((notification) => {
        const dateKey = notification.meta?.arrangementDate || '';
        if (!dateKey) return;

        const current = grouped.get(dateKey) || { delivered: 0, opened: 0 };
        current.delivered += 1;
        if (notification.isRead) current.opened += 1;
        grouped.set(dateKey, current);
      });

    return grouped;
  }, [notifications]);

  const handleSend = async (arrangementDate: string) => {
    setSendingDate(arrangementDate);
    setStatus((current) => ({ ...current, [arrangementDate]: '' }));
    try {
      const result = await db.sendHallTicketsByDate(arrangementDate);
      await loadData();
      setStatus((current) => ({
        ...current,
        [arrangementDate]: `${result.count || 0} hall tickets sent for ${formatDate(arrangementDate)}`,
      }));
    } catch (error) {
      setStatus((current) => ({
        ...current,
        [arrangementDate]: 'Failed to send hall tickets',
      }));
    } finally {
      setSendingDate('');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hall Ticket Dispatch</h1>
        <p className="text-slate-500">Send hall tickets once per exam date, even when multiple seating arrangements exist on that day.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Exam Dates</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{dateGroups.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Assigned Students</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {dateGroups.reduce((sum, item) => sum + item.totalAssigned, 0)}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Delivered Notifications</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {Array.from(notificationStats.values()).reduce((sum, item) => sum + item.delivered, 0)}
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Ticket size={18} className="text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Generated Arrangements By Date</h2>
        </div>
        {dateGroups.length > 0 ? (
          <div className="space-y-4">
            {dateGroups.map((group) => {
              const stats = notificationStats.get(group.date) || { delivered: 0, opened: 0 };

              return (
                <article key={group.date} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-700">
                          {formatDate(group.date)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          <CalendarDays size={14} />
                          {group.totalHalls} halls
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-500">
                        {group.totalAssigned} assigned • {group.totalStudents} students • {group.totalUnassigned} unassigned
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex rounded-full bg-white px-3 py-1 font-semibold text-slate-600">
                          Delivered: {stats.delivered}
                        </span>
                        <span className="inline-flex rounded-full bg-white px-3 py-1 font-semibold text-slate-600">
                          Opened: {stats.opened}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {group.arrangements.map((arrangement) => (
                          <span key={arrangement.id} className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            {arrangement.title || 'Seating Arrangement'}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      <button
                        type="button"
                        onClick={() => handleSend(group.date)}
                        disabled={sendingDate === group.date}
                        className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <Send size={16} />
                        {sendingDate === group.date ? 'Sending...' : 'Send Hall Tickets'}
                      </button>
                      {status[group.date] && (
                        <p className={`text-sm font-medium ${status[group.date].includes('Failed') ? 'text-red-600' : 'text-emerald-600'}`}>
                          {status[group.date]}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">
            <BellRing size={22} className="mx-auto text-slate-400" />
            <p className="mt-3 text-sm text-slate-500">Generate seating arrangements first, then you can send hall tickets from here.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminHallTickets;
