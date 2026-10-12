import { useState } from 'react';
import { Plus, Trash2, CalendarPlus, Check, RotateCcw } from 'lucide-react';
import { storage, useTracker } from '../services/storage';
import { dueLabel } from '../services/dates';
import './TrackerPage.css';

const TEMPLATES = ['Driving licence renewal', 'Passport renewal', 'Scholarship application deadline', 'Income tax return filing', 'Life certificate (pension)', 'Electricity bill due', 'PM-KISAN e-KYC'];

// Standard iCalendar file so reminders land in Google/Apple/Outlook calendars.
const downloadIcs = (t) => {
  const esc = (s) => String(s || '').replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
  const day = t.date.replaceAll('-', '');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SAARTHI//Citizen Tracker//EN', 'BEGIN:VEVENT', `UID:${t.id}@saarthi`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${day}`, `SUMMARY:${esc(t.title)}`, `DESCRIPTION:${esc(t.notes)}`, 'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${esc(t.title)}`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = `${t.title.replace(/[^\w]+/g, '-').toLowerCase()}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

const TrackerPage = () => {
  const items = useTracker();
  const [form, setForm] = useState({ title: '', date: '', notes: '' });

  const update = (id, patch) => storage.saveTracker(items.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const remove = (id) => storage.saveTracker(items.filter((t) => t.id !== id));
  const add = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    storage.addTrackerItem({ title: form.title.trim(), date: form.date, notes: form.notes.trim() });
    setForm({ title: '', date: '', notes: '' });
  };

  const open = items.filter((t) => !t.done).sort((a, b) => a.date.localeCompare(b.date));
  const done = items.filter((t) => t.done);

  const row = (t) => {
    const due = dueLabel(t.date);
    return (
      <li key={t.id} className={`tracker-item ${t.done ? 'done' : due.cls}`}>
        <button type="button" className="check-btn" onClick={() => update(t.id, { done: !t.done })} aria-label={t.done ? 'Mark as not done' : 'Mark as done'}>
          {t.done ? <RotateCcw size={16} /> : <Check size={16} />}
        </button>
        <div className="tracker-body">
          <div className="tracker-title">{t.title}</div>
          {t.notes && <div className="tracker-notes">{t.notes}</div>}
        </div>
        {!t.done && <span className={`due-badge ${due.cls}`}>{due.text}</span>}
        {!t.done && <button type="button" className="icon-action-btn" onClick={() => downloadIcs(t)} title="Add to calendar" aria-label="Add to calendar"><CalendarPlus size={16} /></button>}
        <button type="button" className="icon-action-btn delete" onClick={() => remove(t.id)} title="Delete" aria-label="Delete"><Trash2 size={16} /></button>
      </li>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Your tracker</h1>
        <p className="page-subtitle">Renewals, deadlines and follow-ups — with calendar reminders. Stored only on this device.</p>
      </div>

      <form className="tracker-form" onSubmit={add}>
        <input className="wf-input" list="tracker-templates" placeholder="What do you need to remember?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} aria-label="Task" required maxLength={120} />
        <datalist id="tracker-templates">{TEMPLATES.map((t) => <option key={t} value={t} />)}</datalist>
        <input className="wf-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} aria-label="Due date" required />
        <input className="wf-input" placeholder="Notes (application no., office…)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} aria-label="Notes" maxLength={200} />
        <button type="submit" className="widget-btn primary"><Plus size={14} /> Add</button>
      </form>

      {open.length === 0 && done.length === 0 && <p className="empty-hint">Nothing tracked yet. Add a renewal date above, or tap “Track this” on any answer in the assistant.</p>}
      {open.length > 0 && <ul className="tracker-list">{open.map(row)}</ul>}
      {done.length > 0 && (
        <>
          <h2 className="section-title tracker-done-title">Completed</h2>
          <ul className="tracker-list">{done.map(row)}</ul>
        </>
      )}
    </div>
  );
};

export default TrackerPage;
