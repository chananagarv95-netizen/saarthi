import React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import './CitizenTimeline.css';

const events = [
  {
    id: 1,
    date: 'Oct 12, 2026',
    title: 'Passport Delivered',
    status: 'completed',
    icon: 'CheckCircle2',
    color: 'var(--color-success)',
    action: null
  },
  {
    id: 2,
    date: 'Today',
    title: 'Electricity Bill Due',
    status: 'pending',
    icon: 'Circle',
    color: 'var(--color-accent)',
    action: 'Pay ₹2,450'
  },
  {
    id: 3,
    date: 'Nov 5, 2026',
    title: 'Driving Licence Renewal',
    status: 'upcoming',
    icon: 'Clock',
    color: 'var(--color-primary)',
    action: 'Start Application'
  }
];

const CitizenTimeline = () => {
  return (
    <div className="timeline-container">
      <h3 className="section-title">Your Citizen Timeline</h3>
      <div className="timeline">
        {events.map((event) => (
          <div key={event.id} className={`timeline-node ${event.status}`}>
            <div className="timeline-line"></div>
            <div className="node-icon-wrapper" style={{ color: event.color }}>
              {event.status === 'completed' && <CheckCircle2 size={24} fill="currentColor" color="white" />}
              {event.status === 'pending' && <Circle size={24} fill="var(--color-bg)" strokeWidth={4} />}
              {event.status === 'upcoming' && <Clock size={24} />}
            </div>
            <div className="node-content">
              <span className="node-date">{event.date}</span>
              <h4 className="node-title">{event.title}</h4>
              {event.action && (
                <button className={`node-action-btn ${event.status}`}>{event.action}</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CitizenTimeline;
