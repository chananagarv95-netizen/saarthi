import React, { useState, useEffect } from 'react';
import { timelineApi } from '../services/api';
import { CheckCircle2, Circle, Clock, RefreshCw } from 'lucide-react';
import './TimelinePage.css';

const TimelinePage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await timelineApi.get();
      setEvents(data.events || []);
    } catch (e) {
      setError('Could not load your timeline. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const statusConfig = {
    completed: { label: 'Completed', color: 'var(--color-success)', Icon: CheckCircle2 },
    pending: { label: 'Action Required', color: 'var(--color-accent)', Icon: Circle },
    upcoming: { label: 'Upcoming', color: 'var(--color-primary)', Icon: Clock }
  };

  if (loading) return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Citizen Timeline</h1>
      </div>
      <div className="timeline-skeleton">
        {[1,2,3].map(i => <div key={i} className="skeleton-item"><div className="skeleton-dot"/><div className="skeleton-content"><div className="skeleton-line short"/><div className="skeleton-line long"/></div></div>)}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Citizen Timeline</h1>
          <p className="page-subtitle">Your government service history and upcoming actions</p>
        </div>
        <button className="refresh-btn" onClick={load} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="timeline">
        {events.map((event, idx) => {
          const config = statusConfig[event.status] || statusConfig.upcoming;
          const { Icon } = config;
          return (
            <div key={event.id} className={`timeline-node ${event.status}`}>
              {idx < events.length - 1 && <div className="timeline-connector" />}
              <div className="node-icon-wrap" style={{ color: config.color }}>
                <Icon size={24} />
              </div>
              <div className="node-body">
                <div className="node-top">
                  <span className="node-date">{event.displayDate}</span>
                  <span className="node-badge" style={{ background: `${config.color}20`, color: config.color }}>
                    {config.label}
                  </span>
                </div>
                <h4 className="node-title">{event.title}</h4>
                <p className="node-department">{event.department}</p>
                {event.referenceNo && <p className="node-ref">Ref: {event.referenceNo}</p>}
                {event.amount && <p className="node-amount">{event.amount}</p>}
                {event.action && (
                  <button className={`node-action ${event.status}`}>
                    {event.action}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelinePage;
