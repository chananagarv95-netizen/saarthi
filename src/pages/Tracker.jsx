import { useState } from 'react';
import { Plus, Trash2, CalendarPlus, Check, RotateCcw } from 'lucide-react';
import { storage, useTracker } from '../services/storage';
import { dueLabel } from '../services/dates';

const TEMPLATES = ['Driving licence renewal', 'Passport renewal', 'Scholarship application deadline', 'Income tax return filing', 'Life certificate (pension)', 'Electricity bill due', 'PM-KISAN e-KYC', 'RTI reply due (30 days)'];
const BADGE = { overdue: 'bad', soon: 'warn', later: '' };

// Standard iCalendar file so reminders land in Google / Apple / Outlook calendars.
const downloadIcs = (t) => {
  const esc = (s) => String(s || '').replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SAARTHI//Citizen Tracker//EN', 'BEGIN:VEVENT', `UID:${t.id}@saarthi`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${t.date.replaceAll('-', '')}`, `SUMMARY:${esc(t.title)}`, `DESCRIPTION:${esc(t.notes)}`, 'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${esc(t.title)}`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = `${t.title.replace(/[^\w]+/g, '-').toLowerCase()}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

const Tracker = () => {
  const items = useTracker();
  const [form, setForm] = useState({ title: '', date: '' });
  const update = (id, patch) => storage.saveTracker(items.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const remove = (id) => storage.saveTracker(items.filter((t) => t.id !== id));
  const open = items.filter((t) => !t.done).sort((a, b) => a.date.localeCompare(b.date));
  const done = items.filter((t) => t.done);

  const row = (t) => {
    const due = dueLabel(t.date);
    return (
      <div key={t.id} className={`card hoverable row ${t.done ? 'done' : ''}`}>
        <button type="button" className="circle-btn" onClick={() => update(t.id, { done: !t.done })} aria-label={t.done ? 'Mark not done' : 'Mark done'}>{t.done ? <RotateCcw size={14} /> : <Check size={15} />}</button>
        <div className="row-body">
          <div className="row-title">{t.title}</div>
          {t.notes && <div className="row-sub">{t.notes}</div>}
        </div>
        {!t.done && <span className={`badge ${BADGE[due.cls]}`}>{due.text}</span>}
        {!t.done && <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => downloadIcs(t)} title="Add to calendar" aria-label="Add to calendar"><CalendarPlus size={16} /></button>}
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => remove(t.id)} aria-label="Delete"><Trash2 size={15} /></button>
      </div>
    );
  };

  return (
    <div className="content narrow page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Tracker</h1>
          <p className="page-sub">Renewals, deadlines and follow-ups — export any of them to your calendar with a reminder the day before.</p>
        </div>
      </div>

      <form className="card add-form" onSubmit={(e) => { e.preventDefault(); if (!form.title.trim() || !form.date) return; storage.addTrackerItem({ title: form.title.trim(), date: form.date, notes: '' }); setForm({ title: '', date: '' }); }}>
        <input className="input" list="tracker-templates" placeholder="What do you need to remember?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={120} aria-label="Task" />
        <datalist id="tracker-templates">{TEMPLATES.map((t) => <option key={t} value={t} />)}</datalist>
        <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required aria-label="Due date" />
        <button type="submit" className="btn btn-primary"><Plus size={16} /> Add</button>
      </form>

      {!items.length && <div className="empty">Nothing tracked yet. Add a date above, tap <strong>Track</strong> on any answer, or save a document to your vault.</div>}
      {open.length > 0 && <div className="list">{open.map(row)}</div>}
      {done.length > 0 && (
        <section className="section">
          <div className="section-head"><h2 className="section-title">Completed</h2></div>
          <div className="list">{done.map(row)}</div>
        </section>
      )}
    </div>
  );
};

export default Tracker;
