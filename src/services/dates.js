export const dueLabel = (date) => {
  const days = Math.round((new Date(`${date}T00:00:00`) - new Date(new Date().toDateString())) / 864e5);
  if (days < 0) return { cls: 'overdue', text: `${-days}d overdue` };
  if (days === 0) return { cls: 'soon', text: 'Today' };
  if (days <= 7) return { cls: 'soon', text: days === 1 ? 'Tomorrow' : `In ${days} days` };
  return { cls: 'later', text: new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) };
};
