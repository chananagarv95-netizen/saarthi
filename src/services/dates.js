export const dueLabel = (date) => {
  const days = Math.round((new Date(`${date}T00:00:00`) - new Date(new Date().toDateString())) / 864e5);
  if (days < 0) return { cls: 'overdue', text: `${-days}d overdue` };
  if (days === 0) return { cls: 'soon', text: 'Today' };
  if (days <= 7) return { cls: 'soon', text: days === 1 ? 'Tomorrow' : `In ${days} days` };
  return { cls: 'later', text: new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) };
};

// YYYY-MM-DD in the user's local timezone (toISOString would use UTC).
export const localDate = (offsetDays = 0, from = Date.now()) => new Date(from + offsetDays * 864e5).toLocaleDateString('en-CA');

// Parses "31/03/2027", "31-03-2027" or ISO strings; returns a Date or null.
export const parseDocDate = (value) => {
  const m = String(value || '').match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  const d = m ? new Date(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}T00:00:00`) : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const expiryStatus = (value) => {
  const d = parseDocDate(value);
  if (!d) return null;
  const days = Math.round((d - new Date(new Date().toDateString())) / 864e5);
  if (days < 0) return { cls: 'bad', text: `Expired ${-days}d ago`, days };
  if (days <= 60) return { cls: 'warn', text: `Expires in ${days}d`, days };
  return { cls: 'ok', text: `Valid till ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, days };
};
