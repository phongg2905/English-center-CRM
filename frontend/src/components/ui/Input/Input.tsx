import React, { useState } from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`ui-input-wrapper ${className}`}>
      {label && <label className="ui-input-label">{label}</label>}
      <div
        className={`ui-input-container ${isFocused ? 'focused' : ''} ${error ? 'has-error' : ''}`}
      >
        {leftIcon && <span className="ui-input-icon-left">{leftIcon}</span>}
        <input
          className="ui-input-field"
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && <span className="ui-input-icon-right">{rightIcon}</span>}
      </div>
      {error && <span className="ui-input-error-msg">{error}</span>}
    </div>
  );
};
