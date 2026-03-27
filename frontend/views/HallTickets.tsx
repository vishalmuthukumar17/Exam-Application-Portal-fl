import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, Download, MapPinned, Ticket } from 'lucide-react';
import { useAuth } from '../App';
import { db } from '../store';
import { Application, Exam, Notification, SeatingArrangement } from '../types';

const getEntityId = (value: any) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.id || value._id || value.toString?.() || '';
};

const formatDate = (value?: string) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const openHallTicketPrint = (ticket: any) => {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${ticket.examCode} Hall Ticket</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 24px; background: #f8fafc; font-family: Arial, Helvetica, sans-serif; color: #0f172a; }
          .ticket { max-width: 820px; margin: 0 auto; background: white; border: 2px solid #c7d2fe; border-radius: 28px; padding: 28px; }
          .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
          .badge { display: inline-flex; border-radius: 999px; background: #eef2ff; color: #4f46e5; padding: 8px 14px; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; }
          h1 { margin: 14px 0 6px; font-size: 34px; line-height: 1.05; }
          .subtitle { color: #475569; font-size: 16px; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 28px; }
          .card { border: 1px solid #e2e8f0; border-radius: 20px; padding: 18px; background: #fff; }
          .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: #94a3b8; }
          .value { margin-top: 8px; font-size: 22px; font-weight: 700; color: #0f172a; }
          .value.small { font-size: 18px; }
          .footer { margin-top: 24px; border-top: 1px dashed #cbd5e1; padding-top: 16px; color: #475569; font-size: 14px; }
          @media print {
            body { padding: 0; background: white; }
            .ticket { border-radius: 0; border-width: 0; max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="top">
            <div>
              <div class="badge">Hall Ticket</div>
              <h1>${ticket.examName}</h1>
              <div class="subtitle">${ticket.examCode} • ${ticket.department}</div>
            </div>
            <div class="badge">${formatDate(ticket.examDate)}</div>
          </div>
          <div class="grid">
            <div class="card">
              <div class="label">Student Name</div>
              <div class="value">${ticket.studentName}</div>
            </div>
            <div class="card">
              <div class="label">Roll Number</div>
              <div class="value">${ticket.rollNumber || '-'}</div>
            </div>
            <div class="card">
              <div class="label">Hall</div>
              <div class="value">${ticket.hallName}</div>
            </div>
            <div class="card">
              <div class="label">Seat Number</div>
              <div class="value">${ticket.seatNumber}</div>
            </div>
            <div class="card">
              <div class="label">Exam Date</div>
              <div class="value small">${formatDate(ticket.examDate)}</div>
            </div>
            <div class="card">
              <div class="label">Arrangement Scope</div>
              <div class="value small">${ticket.title}</div>
            </div>
          </div>
          <div class="footer">
            Carry this hall ticket along with your student ID on the exam day.
          </div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

const HallTickets: React.FC = () => {
  const { auth } = useAuth();
  const user = auth.user!;
  const [applications, setApplications] = useState<Application[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [arrangements, setArrangements] = useState<SeatingArrangement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    Promise.all([
      db.getApplications(),
      db.getExams(),
      db.getSeatingArrangements(),
      db.getNotifications(),
    ]).then(([appData, examData, arrangementData, notificationData]) => {
      setApplications(appData);
      setExams(examData);
      setArrangements(arrangementData);
      setNotifications(notificationData);
    });
  }, []);

  const reminders = useMemo(() => {
    const myApps = applications.filter((app) => {
      return getEntityId(app.studentId) === user.id;
    });

    return myApps
      .map((app) => {
        const exam = typeof app.examId === 'object'
          ? app.examId as any
          : exams.find((item) => item.id === app.examId);
        if (!exam) return null;

        return {
          appId: app.id,
          examCode: exam.examCode,
          examName: exam.examName,
          examDate: exam.examDate,
          deadline: exam.deadline,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
  }, [applications, exams, user.id]);

  const hallTickets = useMemo(() => {
    const arrangementTickets = arrangements
      .flatMap((arrangement) => {
        const examDetails = new Map<string, any>();
        const examIdValue = getEntityId(arrangement.examId);

        if (arrangement.examId && typeof arrangement.examId === 'object') {
          const currentExam = arrangement.examId as any;
          examDetails.set(getEntityId(currentExam), currentExam);
        }

        (arrangement.examIds || []).forEach((exam) => {
          if (exam && typeof exam === 'object') {
            const currentExam = exam as any;
            examDetails.set(getEntityId(currentExam), currentExam);
          }
        });

        return (arrangement.halls || []).flatMap((hall) =>
          (hall.assignments || [])
            .filter((assignment) => getEntityId(assignment.studentId) === user.id)
            .map((assignment) => {
              const assignmentExamId = getEntityId(assignment.examId);
              const examMeta = examDetails.get(assignmentExamId || examIdValue) || exams.find((exam) => exam.id === assignmentExamId);
              return {
                key: `${arrangement.id}-${assignment.applicationId}`,
                title: arrangement.title || assignment.examName || 'Exam Hall Ticket',
                arrangementDate: arrangement.arrangementDate,
                hallName: hall.hallName,
                seatNumber: assignment.seatNumber,
                studentName: assignment.studentName,
                rollNumber: assignment.rollNumber,
                department: assignment.department,
                examCode: assignment.examCode || examMeta?.examCode || '',
                examName: assignment.examName || examMeta?.examName || '',
                examDate: examMeta?.examDate || arrangement.arrangementDate,
              };
            })
        );
      })
      .sort((a, b) => new Date(a.examDate || a.arrangementDate || '').getTime() - new Date(b.examDate || b.arrangementDate || '').getTime());

    const notificationTickets = notifications
      .filter((notification) => getEntityId(notification.userId) === user.id && notification.type === 'hall_ticket')
      .map((notification) => {
        const examMeta = exams.find((exam) => exam.examCode === (notification.meta?.examCode || ''));
        return {
          key: `notification-${notification.id}`,
          title: notification.title || 'Hall Ticket Ready',
          arrangementDate: notification.meta?.arrangementDate || '',
          hallName: notification.meta?.hallName || '',
          seatNumber: notification.meta?.seatNumber || '',
          studentName: user.name,
          rollNumber: user.rollNumber || '',
          department: user.department,
          examCode: notification.meta?.examCode || examMeta?.examCode || '',
          examName: notification.meta?.examName || examMeta?.examName || '',
          examDate: examMeta?.examDate || notification.meta?.arrangementDate || '',
        };
      });

    const merged = [...arrangementTickets];
    const seen = new Set(arrangementTickets.map((ticket) => `${ticket.examCode}|${ticket.seatNumber}`));

    notificationTickets.forEach((ticket) => {
      const ticketKey = `${ticket.examCode}|${ticket.seatNumber}`;
      if (!seen.has(ticketKey)) {
        merged.push(ticket);
        seen.add(ticketKey);
      }
    });

    return merged.sort((a, b) => new Date(a.examDate || a.arrangementDate || '').getTime() - new Date(b.examDate || b.arrangementDate || '').getTime());
  }, [arrangements, exams, notifications, user.department, user.id, user.name, user.rollNumber]);

  const hallTicketNotifications = useMemo(() => {
    return notifications
      .filter((notification) => {
        return getEntityId(notification.userId) === user.id && (notification.type === 'hall_ticket' || notification.type === 'seating_arrangement');
      })
      .slice(0, 5);
  }, [notifications, user.id]);

  const hallTicketNotificationKeys = useMemo(() => {
    return new Set(
      notifications
        .filter((notification) => {
          return getEntityId(notification.userId) === user.id && (notification.type === 'hall_ticket' || notification.type === 'seating_arrangement');
        })
        .map((notification) => `${notification.meta?.examCode || ''}|${notification.meta?.seatNumber || ''}`)
    );
  }, [notifications, user.id]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reminders & Hall Tickets</h1>
        <p className="text-slate-500">Track upcoming subjects and open your hall ticket as soon as seating is assigned.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_minmax(0,1fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BellRing size={18} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Subject Reminders</h2>
          </div>
          {reminders.length > 0 ? (
            <div className="space-y-3">
              {reminders.map((item) => (
                <div key={item.appId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">{item.examCode}</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{item.examName}</p>
                  </div>
                  {(item.examDate || item.deadline) && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {item.examDate && (
                        <span className="inline-flex items-center rounded-full bg-white px-3 py-1 font-semibold text-slate-600">
                          Exam: {formatDate(item.examDate)}
                        </span>
                      )}
                      {item.deadline && (
                        <span className="inline-flex items-center rounded-full bg-white px-3 py-1 font-semibold text-slate-600">
                          Deadline: {formatDate(item.deadline)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No applied subjects found yet.
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Ticket size={18} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Latest Hall Ticket Alerts</h2>
          </div>
          {hallTicketNotifications.length > 0 ? (
            <div className="space-y-3">
              {hallTicketNotifications.map((notification) => (
                <div key={notification.id} className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-4">
                  <p className="text-sm font-bold text-slate-900">{notification.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Hall ticket alerts will appear here after seating is published.
            </p>
          )}
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <MapPinned size={18} className="text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Available Hall Tickets</h2>
        </div>
        {hallTickets.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {hallTickets.map((ticket) => {
              const isReady = hallTicketNotificationKeys.has(`${ticket.examCode}|${ticket.seatNumber}`);

              return (
              <article key={ticket.key} className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">{ticket.examCode}</p>
                    <h3 className="mt-2 text-xl font-bold text-slate-900">{ticket.examName}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-sm text-slate-500">{ticket.title}</p>
                      {isReady && (
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                          Hall Ticket Ready
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openHallTicketPrint(ticket)}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    <Download size={16} />
                    Hall Ticket
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Exam Date</p>
                    <p className="mt-2 text-base font-bold text-slate-900">{formatDate(ticket.examDate)}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Hall</p>
                    <p className="mt-2 text-base font-bold text-slate-900">{ticket.hallName}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Seat Number</p>
                    <p className="mt-2 text-base font-bold text-slate-900">{ticket.seatNumber}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Department</p>
                    <p className="mt-2 text-base font-bold text-slate-900">{ticket.department}</p>
                  </div>
                </div>
              </article>
            )})}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No hall tickets are available yet. Once the admin publishes seating, your hall ticket will appear here.
          </p>
        )}
      </section>
    </div>
  );
};

export default HallTickets;
