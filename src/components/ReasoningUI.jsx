import { useEffect, useState } from 'react';
import { Check, Loader } from 'lucide-react';
import './ReasoningUI.css';

// Progress indicator shown while a real request is in flight. Steps advance on a
// timer but the last one stays active until the parent unmounts this component.
const ReasoningUI = ({ steps }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (current >= steps.length - 1) return undefined;
    const t = setTimeout(() => setCurrent((c) => c + 1), 1100);
    return () => clearTimeout(t);
  }, [current, steps.length]);

  return (
    <div className="reasoning-ui" role="status" aria-live="polite">
      {steps.map((step, i) => (
        <div key={step} className={`reasoning-step ${i < current ? 'completed' : i === current ? 'active' : 'pending'}`}>
          <div className="step-icon">
            {i < current ? <Check size={14} className="icon-check" strokeWidth={3} /> : i === current ? <Loader size={14} className="icon-loader" strokeWidth={3} /> : <div className="icon-dot" />}
          </div>
          <span className="step-text">{step}</span>
        </div>
      ))}
    </div>
  );
};

export default ReasoningUI;
