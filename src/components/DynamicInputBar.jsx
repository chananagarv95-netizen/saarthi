import React, { useState } from 'react';
import { Mic, Paperclip, ArrowUp } from 'lucide-react';
import './DynamicInputBar.css';

const DynamicInputBar = ({ onSubmit, autoFocus, onUploadClick }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && onSubmit) {
      onSubmit(value);
      setValue('');
    }
  };

  return (
    <div className={`input-container ${isFocused ? 'focused' : ''}`}>
      <form className="input-wrapper" onSubmit={handleSubmit}>
        <button type="button" className="icon-btn" aria-label="Upload document" onClick={onUploadClick}>
          <Paperclip size={20} />
        </button>
        
        <input 
          type="text" 
          placeholder="Describe your problem..." 
          className="dynamic-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus={autoFocus}
        />
        
        {value ? (
          <button type="submit" className="submit-btn" aria-label="Submit">
            <ArrowUp size={20} strokeWidth={2.5} />
          </button>
        ) : (
          <button type="button" className="icon-btn pulse-hover" aria-label="Voice input">
            <Mic size={20} />
          </button>
        )}
      </form>
    </div>
  );
};

export default DynamicInputBar;
