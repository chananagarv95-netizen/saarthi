// Timeline service - provides citizen's application/event timeline
const { v4: uuidv4 } = require('uuid');

// Mock timeline data - in production this would come from gov databases
const TIMELINE_EVENTS = [
  {
    id: uuidv4(),
    date: '2026-10-12',
    displayDate: 'Oct 12, 2026',
    title: 'Passport Delivered',
    category: 'PASSPORT',
    status: 'completed',
    icon: '🛂',
    department: 'Ministry of External Affairs',
    referenceNo: 'J1234567',
    action: null
  },
  {
    id: uuidv4(),
    date: new Date().toISOString().split('T')[0],
    displayDate: 'Today',
    title: 'Electricity Bill Due',
    category: 'ELECTRICITY',
    status: 'pending',
    icon: '⚡',
    department: 'DISCOM',
    amount: '₹2,450',
    action: 'Pay Now'
  },
  {
    id: uuidv4(),
    date: '2026-11-05',
    displayDate: 'Nov 5, 2026',
    title: 'Driving Licence Renewal',
    category: 'DRIVING_LICENCE',
    status: 'upcoming',
    icon: '🚗',
    department: 'Ministry of Road Transport',
    action: 'Start Application'
  },
  {
    id: uuidv4(),
    date: '2026-12-01',
    displayDate: 'Dec 1, 2026',
    title: 'Income Tax Filing Deadline',
    category: 'INCOME_TAX',
    status: 'upcoming',
    icon: '📊',
    department: 'Income Tax Department',
    action: 'File Now'
  }
];

const getTimeline = () => {
  return TIMELINE_EVENTS.sort((a, b) => {
    const statusOrder = { completed: 0, pending: 1, upcoming: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });
};

const addTimelineEvent = (event) => {
  const newEvent = { id: uuidv4(), ...event, createdAt: new Date().toISOString() };
  TIMELINE_EVENTS.push(newEvent);
  return newEvent;
};

module.exports = { getTimeline, addTimelineEvent };
