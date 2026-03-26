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
  const [sendingId, setSendingId] = useState('');
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

  const arrangementCards = useMemo(
    () => arrangements
      .filter((arrangement) => arrangement.totalAssigned > 0)
      .sort((a, b) => new Date(b.arrangementDate || '').getTime() - new Date(a.arrangementDate || '').getTime()),
    [arrangements]
  );

  const notificationStats = useMemo(() => {
    const grouped = new Map<string, { delivered: number; opened: number }>();

    notifications
      .filter((notification) => notification.type === 'hall_ticket')
      .forEach((notification) => {
        const arrangementId = notification.meta?.arrangementId || '';
        if (!arrangementId) return;

        const current = grouped.get(arrangementId) || { delivered: 0, opened: 0 };
        current.delivered += 1;
        if (notification.isRead) current.opened += 1;
        grouped.set(arrangementId, current);
      });

    return grouped;
  }, [notifications]);

  const handleSend = async (arrangementId: string) => {
    setSendingId(arrangementId);
    setStatus((current) => ({ ...current, [arrangementId]: '' }));
    try {
      const result = await db.sendHallTickets(arrangementId);
      await loadData();
      setStatus((current) => ({
        ...current,
        [arrangementId]: `${result.count || 0} hall tickets sent`,
      }));
    } catch (error) {
      setStatus((current) => ({
        ...current,
        [arrangementId]: 'Failed to send hall tickets',
      }));
    } finally {
      setSendingId('');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hall Ticket Dispatch</h1>
        <p className="text-slate-500">Send generated hall tickets to all assigned students and track whether they were delivered.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Saved Arrangements</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{arrangementCards.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Assigned Students</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {arrangementCards.reduce((sum, arrangement) => sum + arrangement.totalAssigned, 0)}
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
          <h2 className="text-lg font-bold text-slate-900">Generated Arrangements</h2>
        </div>
        {arrangementCards.length > 0 ? (
          <div className="space-y-4">
            {arrangementCards.map((arrangement) => {
              const stats = notificationStats.get(arrangement.id) || { delivered: 0, opened: 0 };

              return (
                <article key={arrangement.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-700">
                          {formatDate(arrangement.arrangementDate)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          <CalendarDays size={14} />
                          {arrangement.halls.length} halls
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-bold text-slate-900">{arrangement.title || 'Seating Arrangement'}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {arrangement.totalAssigned} assigned • {arrangement.totalStudents} students • {arrangement.unassignedCount} unassigned
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex rounded-full bg-white px-3 py-1 font-semibold text-slate-600">
                          Delivered: {stats.delivered}
                        </span>
                        <span className="inline-flex rounded-full bg-white px-3 py-1 font-semibold text-slate-600">
                          Opened: {stats.opened}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      <button
                        type="button"
                        onClick={() => handleSend(arrangement.id)}
                        disabled={sendingId === arrangement.id}
                        className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <Send size={16} />
                        {sendingId === arrangement.id ? 'Sending...' : 'Send Hall Tickets'}
                      </button>
                      {status[arrangement.id] && (
                        <p className={`text-sm font-medium ${status[arrangement.id].includes('Failed') ? 'text-red-600' : 'text-emerald-600'}`}>
                          {status[arrangement.id]}
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
