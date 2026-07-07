import React, { useState, useEffect } from 'react';
import { Check, Loader, Sparkles } from 'lucide-react';
import './ReasoningUI.css';

const ReasoningUI = ({ steps, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        if (currentStep + 1 === steps.length && onComplete) {
          onComplete();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, steps, onComplete]);

  return (
    <div className="reasoning-ui">
      {steps.map((step, index) => (
        <div 
          key={index} 
          className={`reasoning-step ${index < currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''} ${index > currentStep ? 'pending' : ''}`}
        >
          <div className="step-icon">
            {index < currentStep ? (
              <Check size={14} className="icon-check" strokeWidth={3} />
            ) : index === currentStep ? (
              <Loader size={14} className="icon-loader" strokeWidth={3} />
            ) : (
              <div className="icon-dot" />
            )}
          </div>
          <span className="step-text">{step}</span>
        </div>
      ))}
    </div>
  );
};

export default ReasoningUI;
