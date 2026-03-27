import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../store';
import { useAuth } from '../App';
import { Application, ApplicationStatus, Exam, SeatingArrangement as SeatingArrangementType } from '../types';
import { Building2, Download, Printer, Users } from 'lucide-react';

type HallForm = {
  id: string;
  hallName: string;
  rows: number;
  columns: number;
};

type Candidate = {
  applicationId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  department: string;
  examId: string;
  examCode: string;
  examName: string;
};

const ALL_EXAMS_VALUE = '__all__';

const rowLabel = (index: number) => {
  let current = index;
  let label = '';
  while (current > 0) {
    const remainder = (current - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    current = Math.floor((current - 1) / 26);
  }
  return label;
};

const formatExamDate = (value?: string) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const createHall = (index: number, hallName?: string, rows = 5, columns = 6): HallForm => ({
  id: `hall-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
  hallName: hallName || `Hall ${rowLabel(index + 1)}`,
  rows,
  columns,
});

const SeatingArrangement: React.FC = () => {
  const { auth } = useAuth();
  const user = auth.user!;
  const [exams, setExams] = useState<Exam[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [arrangements, setArrangements] = useState<SeatingArrangementType[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [halls, setHalls] = useState<HallForm[]>([
    createHall(0, 'Hall A', 5, 6),
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTickets, setIsSendingTickets] = useState(false);
  const [ticketStatus, setTicketStatus] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [examData, appData, arrangementData] = await Promise.all([
      db.getExams(),
      db.getApplications(),
      db.getSeatingArrangements(),
    ]);
    setExams(examData);
    setApplications(appData);
    setArrangements(arrangementData);
  };

  const availableDates = useMemo(
    () => Array.from(new Set(exams.map((exam) => exam.examDate).filter(Boolean))).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    ),
    [exams]
  );

  const dateFilteredExams = useMemo(
    () => exams
      .filter((exam) => !selectedDate || exam.examDate === selectedDate)
      .sort((a, b) => a.examCode.localeCompare(b.examCode)),
    [exams, selectedDate]
  );

  useEffect(() => {
    if (!selectedDate) {
      setSelectedExamId('');
      return;
    }

    const exists = dateFilteredExams.some((exam) => exam.id === selectedExamId);
    if (!exists) {
      setSelectedExamId(dateFilteredExams.length > 1 ? ALL_EXAMS_VALUE : dateFilteredExams[0]?.id || '');
    }
  }, [selectedDate, dateFilteredExams, selectedExamId]);

  const approvedApplications = useMemo(
    () => applications.filter((app) => app.status === ApplicationStatus.APPROVED),
    [applications]
  );

  const selectedExams = useMemo(() => {
    if (!selectedDate) return [];
    if (selectedExamId === ALL_EXAMS_VALUE || !selectedExamId) return dateFilteredExams;
    return dateFilteredExams.filter((exam) => exam.id === selectedExamId);
  }, [selectedDate, selectedExamId, dateFilteredExams]);

  const selectedExamIds = useMemo(
    () => new Set(selectedExams.map((exam) => exam.id)),
    [selectedExams]
  );

  const examCandidates = useMemo<Candidate[]>(() => {
    if (selectedExams.length === 0) return [];

    return approvedApplications
      .filter((app) => {
        const examRef = app.examId as any;
        const examId = typeof examRef === 'string' ? examRef : examRef?._id || examRef?.id;
        return selectedExamIds.has(examId);
      })
      .map((app) => {
        const student = app.studentId as any;
        const exam = app.examId as any;
        return {
          applicationId: app.id,
          studentId: student?.id || student?._id || app.studentId,
          studentName: student?.name || 'Student',
          rollNumber: student?.rollNumber || '',
          department: student?.department || 'UNKNOWN',
          examId: exam?.id || exam?._id || '',
          examCode: exam?.examCode || '',
          examName: exam?.examName || '',
        };
      });
  }, [approvedApplications, selectedExams, selectedExamIds]);

  const scopeKey = useMemo(() => {
    if (!selectedDate) return '';
    return selectedExamId === ALL_EXAMS_VALUE ? `date:${selectedDate}` : `exam:${selectedExamId}`;
  }, [selectedDate, selectedExamId]);

  const existingArrangement = useMemo(
    () => arrangements.find((arrangement: any) => arrangement.scopeKey === scopeKey) || null,
    [arrangements, scopeKey]
  );

  useEffect(() => {
    if (!scopeKey) {
      setHalls([createHall(0, 'Hall A', 5, 6)]);
      return;
    }

    if (existingArrangement?.halls?.length) {
      setHalls(existingArrangement.halls.map((hall: any, index: number) => (
        createHall(index, hall.hallName, hall.rows, hall.columns)
      )));
    }
  }, [scopeKey, existingArrangement]);

  const pageTitle = useMemo(() => {
    if (!selectedDate) return '';
    if (selectedExamId === ALL_EXAMS_VALUE) return `All Exams on ${formatExamDate(selectedDate)}`;
    const exam = selectedExams[0];
    return exam ? `${exam.examCode} - ${exam.examName}` : '';
  }, [selectedDate, selectedExamId, selectedExams]);

  const pageSubtitle = useMemo(() => {
    if (!selectedDate) return '';
    if (selectedExamId === ALL_EXAMS_VALUE) return `${selectedExams.length} exams combined • ${formatExamDate(selectedDate)}`;
    const exam = selectedExams[0];
    return exam ? `${exam.department} department exam • ${formatExamDate(exam.examDate)}` : '';
  }, [selectedDate, selectedExamId, selectedExams]);

  const totalCapacity = useMemo(
    () => halls.reduce((sum, hall) => sum + (hall.rows * hall.columns), 0),
    [halls]
  );

  const buildAlternatingOrder = (students: Candidate[], capacity: number, columns: number) => {
    const queues = new Map<string, Candidate[]>();
    students.forEach((student) => {
      if (!queues.has(student.examCode)) queues.set(student.examCode, []);
      queues.get(student.examCode)!.push(student);
    });

    const result: Candidate[] = [];

    for (let seatIndex = 0; seatIndex < capacity && queues.size > 0; seatIndex += 1) {
      const left = seatIndex % columns === 0 ? null : result[seatIndex - 1];
      const above = seatIndex >= columns ? result[seatIndex - columns] : null;

      const sortedEntries = Array.from(queues.entries()).sort((a, b) => b[1].length - a[1].length);
      let pickedCode = sortedEntries.find(([code]) => code !== left?.examCode && code !== above?.examCode)?.[0];

      if (!pickedCode) {
        pickedCode = sortedEntries.find(([code]) => code !== left?.examCode)?.[0] || sortedEntries[0]?.[0];
      }
      if (!pickedCode) break;

      const queue = queues.get(pickedCode)!;
      const pickedStudent = queue.shift()!;
      result.push(pickedStudent);
      if (queue.length === 0) queues.delete(pickedCode);
    }

    return result;
  };

  const generatedPreview = useMemo(() => {
    if (!scopeKey || selectedExams.length === 0 || halls.length === 0) return null;

    let remainingStudents = [...examCandidates];
    const generatedHalls = halls.map((hall) => {
      const capacity = hall.rows * hall.columns;
      const orderedForHall = buildAlternatingOrder(remainingStudents, capacity, hall.columns);
      const usedIds = new Set(orderedForHall.map((student) => student.applicationId));
      remainingStudents = remainingStudents.filter((student) => !usedIds.has(student.applicationId));

      const assignments = orderedForHall.map((student, seatIndex) => {
        const rowNumber = Math.floor(seatIndex / hall.columns) + 1;
        const columnNumber = (seatIndex % hall.columns) + 1;
        return {
          ...student,
          seatNumber: `${hall.hallName}-${rowLabel(rowNumber)}${columnNumber}`,
          rowNumber,
          columnNumber,
        };
      });

      return {
        hallName: hall.hallName,
        rows: hall.rows,
        columns: hall.columns,
        capacity,
        assignments,
      };
    });

    const totalAssigned = generatedHalls.reduce((sum, hall) => sum + hall.assignments.length, 0);

    return {
      scopeKey,
      arrangementDate: selectedDate,
      examId: selectedExamId === ALL_EXAMS_VALUE ? null : selectedExams[0]?.id || null,
      examIds: selectedExams.map((exam) => exam.id),
      title: pageTitle,
      generatedBy: user.id,
      totalStudents: examCandidates.length,
      totalAssigned,
      unassignedCount: Math.max(examCandidates.length - totalAssigned, 0),
      halls: generatedHalls,
    };
  }, [scopeKey, selectedDate, selectedExamId, selectedExams, halls, examCandidates, pageTitle, user.id]);

  const arrangementToShow = generatedPreview || existingArrangement;

  const addHall = () => {
    setHalls((current) => [
      ...current,
      createHall(current.length, `Hall ${rowLabel(current.length + 1)}`, 5, 6),
    ]);
  };

  const updateHall = (index: number, field: keyof HallForm, value: string) => {
    setHalls((current) => current.map((hall, hallIndex) => (
      hallIndex === index
        ? { ...hall, [field]: field === 'hallName' ? value : Math.max(Number(value) || 1, 1) }
        : hall
    )));
  };

  const removeHall = (index: number) => {
    setHalls((current) => current.filter((_, hallIndex) => hallIndex !== index));
  };

  const exportCsv = () => {
    if (!arrangementToShow) return;
    const lines = ['Hall,Seat Number,Exam Code,Student Name,Roll Number,Department'];
    arrangementToShow.halls.forEach((hall: any) => {
      hall.assignments.forEach((assignment: any) => {
        lines.push([
          hall.hallName,
          assignment.seatNumber,
          assignment.examCode || '',
          assignment.studentName,
          assignment.rollNumber,
          assignment.department,
        ].join(','));
      });
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pageTitle.replace(/[^a-z0-9]+/gi, '_')}_seating_arrangement.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openPdfPrintLayout = (arrangement: any) => {
    if (!arrangement) return;

    const printWindow = window.open('', '_blank', 'width=1400,height=900');
    if (!printWindow) return;

    const hallSections = arrangement.halls.map((hall: any) => {
      const seatLookup = new Map(
        hall.assignments.map((assignment: any) => [`${assignment.rowNumber}-${assignment.columnNumber}`, assignment])
      );

      const cards = Array.from({ length: hall.rows * hall.columns }, (_, index) => {
        const currentRow = Math.floor(index / hall.columns) + 1;
        const currentColumn = (index % hall.columns) + 1;
        const assignment = seatLookup.get(`${currentRow}-${currentColumn}`);
        const seatLabel = `${hall.hallName}-${rowLabel(currentRow)}${currentColumn}`;

        return `
          <div class="seat-card ${assignment ? 'filled' : 'empty'}">
            <div class="seat-code">${seatLabel}</div>
            ${assignment ? `
              <div class="student-name">${assignment.studentName}</div>
              <div class="roll-number">${assignment.rollNumber || '&nbsp;'}</div>
              <div class="exam-pill">${assignment.examCode || ''}</div>
              <div class="department-pill">${assignment.department}</div>
            ` : `
              <div class="empty-seat">Empty Seat</div>
            `}
          </div>
        `;
      }).join('');

      return `
        <section class="hall-section">
          <div class="hall-header">
            <div>
              <div class="hall-title">${hall.hallName}</div>
              <div class="hall-subtitle">${pageTitle} • ${hall.assignments.length} / ${hall.capacity} seats filled</div>
            </div>
            <div class="hall-meta">${hall.rows} rows x ${hall.columns} cols</div>
          </div>
          <div class="hall-grid" style="grid-template-columns: repeat(${hall.columns}, minmax(110px, 1fr));">
            ${cards}
          </div>
        </section>
      `;
    }).join('');

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${pageTitle}</title>
          <style>
            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; background: white; color: #0f172a; font-family: Arial, Helvetica, sans-serif; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page { width: 100%; padding: 8mm; }
            .print-header { margin-bottom: 8mm; }
            .print-title { font-size: 24px; font-weight: 700; line-height: 1.1; }
            .print-subtitle { margin-top: 6px; color: #64748b; font-size: 13px; }
            .hall-section { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 10px; margin-bottom: 8px; page-break-inside: avoid; break-inside: avoid; }
            .hall-section:last-child { margin-bottom: 0; }
            .hall-header { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 8px; }
            .hall-title { font-size: 18px; font-weight: 700; line-height: 1.1; }
            .hall-subtitle { margin-top: 2px; color: #64748b; font-size: 12px; }
            .hall-meta { padding: 5px 9px; border-radius: 999px; background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 600; white-space: nowrap; }
            .hall-grid { display: grid; gap: 7px; }
            .seat-card { border-radius: 12px; border: 1px solid #c7d2fe; background: #eef2ff; padding: 8px; min-height: 88px; }
            .seat-card.empty { border-style: dashed; border-color: #e2e8f0; background: #f8fafc; }
            .seat-code { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; line-height: 1.1; }
            .student-name { margin-top: 7px; font-size: 13px; font-weight: 700; color: #1e293b; line-height: 1.15; }
            .roll-number { margin-top: 3px; font-size: 11px; color: #64748b; line-height: 1.1; }
            .exam-pill, .department-pill { display: inline-block; margin-top: 6px; padding: 4px 7px; border-radius: 999px; background: white; color: #4f46e5; font-size: 9px; font-weight: 700; text-transform: uppercase; line-height: 1.1; margin-right: 4px; }
            .empty-seat { margin-top: 26px; font-size: 11px; font-weight: 600; color: #cbd5e1; }
            @page { size: A4 landscape; margin: 8mm; }
            @media print {
              .page { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="print-header">
              <div class="print-title">${pageTitle}</div>
              <div class="print-subtitle">${pageSubtitle}</div>
            </div>
            ${hallSections}
          </div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const saveArrangementAndDownloadPdf = async () => {
    if (!generatedPreview) return;
    setIsSaving(true);
    setTicketStatus('');
    try {
      const savedArrangement = await db.saveSeatingArrangement(generatedPreview as any);
      await loadData();
      openPdfPrintLayout(savedArrangement as any);
    } finally {
      setIsSaving(false);
    }
  };

  const printArrangement = () => {
    if (!arrangementToShow) return;
    openPdfPrintLayout(arrangementToShow as any);
  };

  const sendHallTickets = async () => {
    if (!selectedDate) return;

    setIsSendingTickets(true);
    setTicketStatus('');
    try {
      const result = await db.sendHallTicketsByDate(selectedDate);
      setTicketStatus(`${result.count || 0} hall tickets sent for ${formatExamDate(selectedDate)}`);
    } catch (error) {
      setTicketStatus('Failed to send hall tickets');
    } finally {
      setIsSendingTickets(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Seating Arrangement</h1>
          <p className="text-slate-500">Generate seating by exam date or exam, with manual hall rows and columns.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={printArrangement} disabled={!arrangementToShow} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">
            <Printer size={16} />
            Print
          </button>
          <button onClick={exportCsv} disabled={!arrangementToShow} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Generate Plan</h2>
            <div className="mt-5 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Exam Date</label>
                <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select date</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>{formatExamDate(date)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Exam</label>
                <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} disabled={!selectedDate} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60">
                  <option value="">Select exam</option>
                  {dateFilteredExams.length > 1 && (
                    <option value={ALL_EXAMS_VALUE}>All exams on {formatExamDate(selectedDate)}</option>
                  )}
                  {dateFilteredExams.map((exam) => (
                    <option key={exam.id} value={exam.id}>{exam.examCode} - {exam.examName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-700">Halls</label>
                  <button type="button" onClick={addHall} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Add hall</button>
                </div>
                {halls.map((hall, index) => (
                  <div key={hall.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3">
                      <input
                        value={hall.hallName}
                        onChange={(e) => updateHall(index, 'hallName', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Hall name"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          min={1}
                          value={hall.rows}
                          onChange={(e) => updateHall(index, 'rows', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Rows"
                        />
                        <input
                          type="number"
                          min={1}
                          value={hall.columns}
                          onChange={(e) => updateHall(index, 'columns', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Columns"
                        />
                      </div>
                      {halls.length > 1 && (
                        <button type="button" onClick={() => removeHall(index)} className="text-left text-sm font-semibold text-red-600 hover:text-red-700">Remove hall</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-indigo-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Approved Students</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{examCandidates.length}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Total Capacity</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{totalCapacity}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={saveArrangementAndDownloadPdf}
                disabled={!generatedPreview || isSaving || !selectedDate || !selectedExamId}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving and Downloading PDF...' : 'Generate and Save Arrangement'}
              </button>

              <button
                type="button"
                onClick={sendHallTickets}
                disabled={!selectedDate || !existingArrangement || isSendingTickets}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {isSendingTickets ? 'Sending Hall Tickets...' : 'Send Hall Tickets for This Date'}
              </button>

              {ticketStatus && (
                <p className={`rounded-2xl px-4 py-3 text-sm ${
                  ticketStatus.includes('Failed')
                    ? 'border border-red-200 bg-red-50 text-red-700'
                    : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}>
                  {ticketStatus}
                </p>
              )}

              {generatedPreview && generatedPreview.unassignedCount > 0 && (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Capacity is short. {generatedPreview.unassignedCount} student{generatedPreview.unassignedCount === 1 ? '' : 's'} will remain unassigned.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {arrangementToShow && selectedDate ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                      {selectedExamId === ALL_EXAMS_VALUE ? formatExamDate(selectedDate) : selectedExams[0]?.examCode}
                    </div>
                    <h2 className="mt-3 text-2xl font-bold text-slate-900">{pageTitle}</h2>
                    <p className="mt-1 text-sm text-slate-500">{pageSubtitle}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Students</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{arrangementToShow.totalStudents}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center">
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Assigned</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{arrangementToShow.totalAssigned}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Halls</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{arrangementToShow.halls?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                {(arrangementToShow.halls || []).map((hall: any) => {
                  const seatLookup = new Map(
                    hall.assignments.map((assignment: any) => [`${assignment.rowNumber}-${assignment.columnNumber}`, assignment])
                  );
                  return (
                    <section key={hall.hallName} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                            <Building2 size={20} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">{hall.hallName}</h3>
                            <p className="text-sm text-slate-500">{hall.assignments.length} / {hall.capacity} seats filled</p>
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          <Users size={14} />
                          {hall.rows} rows x {hall.columns} cols
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <div className="grid gap-3 min-w-max" style={{ gridTemplateColumns: `repeat(${hall.columns}, minmax(130px, 1fr))` }}>
                          {Array.from({ length: hall.rows * hall.columns }, (_, index) => {
                            const currentRow = Math.floor(index / hall.columns) + 1;
                            const currentColumn = (index % hall.columns) + 1;
                            const assignment = seatLookup.get(`${currentRow}-${currentColumn}`);

                            return (
                              <div
                                key={`${hall.hallName}-${currentRow}-${currentColumn}`}
                                className={`rounded-2xl border p-3 ${assignment ? 'border-indigo-200 bg-indigo-50/70' : 'border-dashed border-slate-200 bg-slate-50'}`}
                              >
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                  {hall.hallName}-{rowLabel(currentRow)}{currentColumn}
                                </p>
                                {assignment ? (
                                  <>
                                    <p className="mt-2 text-sm font-bold text-slate-900">{assignment.studentName}</p>
                                    <p className="mt-1 text-xs text-slate-500">{assignment.rollNumber}</p>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      <p className="inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                                        {assignment.examCode}
                                      </p>
                                      <p className="inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                                        {assignment.department}
                                      </p>
                                    </div>
                                  </>
                                ) : (
                                  <p className="mt-4 text-xs font-medium text-slate-300">Empty Seat</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-white px-6 py-24 text-center shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Select a date to generate seating</h2>
              <p className="mt-2 text-sm text-slate-500">Use manual hall rows and columns. For combined dates, nearby seats try to use different subjects.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatingArrangement;
